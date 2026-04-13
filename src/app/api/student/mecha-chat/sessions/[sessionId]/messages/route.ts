import { NextResponse } from "next/server";
import { MechaChatRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireStudent, getStudentId } from "@/lib/api-auth";
import { loadMechaChatContext } from "@/lib/mecha-chat/context";
import { buildMechaChatSystemPrompt } from "@/lib/mecha-chat/system-prompt";
import { completeMechaChat, type ChatMessage } from "@/lib/mecha-chat/openai-chat";
import { transcribeAudioBytes, MECHA_CHAT_MAX_AUDIO_BYTES } from "@/lib/mecha-chat/transcribe";
import { parseDataUrlToBuffer } from "@/lib/driving-guide/ocr";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteParams = { params: Promise<{ sessionId: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const { sessionId } = await params;

  const session = await prisma.mechaChatSession.findFirst({
    where: { id: sessionId, studentId },
  });

  if (!session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  const messages = await prisma.mechaChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: RouteParams) {
  const auth = await requireStudent();
  if (!auth.ok) return auth.response;

  const studentId = await getStudentId(auth.parentId);
  if (!studentId) {
    return NextResponse.json({ error: "未找到学生" }, { status: 404 });
  }

  const student = await prisma.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { parent: { select: { mechaChatEnabled: true } } },
  });

  if (!student.parent.mechaChatEnabled) {
    return NextResponse.json(
      { error: "家长已关闭机甲对话", code: "MECHA_CHAT_DISABLED" },
      { status: 403 },
    );
  }

  const { sessionId } = await params;

  const session = await prisma.mechaChatSession.findFirst({
    where: { id: sessionId, studentId },
  });

  if (!session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const textIn = typeof body.text === "string" ? body.text.trim() : "";
  const audioBase64 = typeof body.audioBase64 === "string" ? body.audioBase64 : "";
  const audioMimeType =
    typeof body.audioMimeType === "string" && body.audioMimeType.trim()
      ? body.audioMimeType.trim()
      : "audio/webm";

  let userText = textIn;

  if (!userText && audioBase64) {
    let buf: Buffer;
    try {
      buf = parseDataUrlToBuffer(audioBase64);
    } catch {
      return NextResponse.json({ error: "音频格式无效" }, { status: 400 });
    }
    if (buf.length > MECHA_CHAT_MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "录音过大" }, { status: 400 });
    }
    try {
      const ext =
        audioMimeType.includes("mp4") || audioMimeType.includes("m4a")
          ? "m4a"
          : audioMimeType.includes("wav")
            ? "wav"
            : "webm";
      userText = await transcribeAudioBytes(
        buf,
        `recording.${ext}`,
        audioMimeType,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "转写失败";
      console.error("[mecha-chat] transcribe failed:", e);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  if (!userText) {
    return NextResponse.json(
      { error: "请输入文字或发送录音" },
      { status: 400 },
    );
  }

  const ctx = await loadMechaChatContext(studentId);
  if (!ctx) {
    return NextResponse.json(
      { error: "请先领养并选择主机甲", code: "NEED_PRIMARY_MECHA" },
      { status: 400 },
    );
  }

  const systemPrompt = buildMechaChatSystemPrompt(ctx);

  const userRow = await prisma.mechaChatMessage.create({
    data: {
      sessionId,
      role: MechaChatRole.USER,
      content: userText,
    },
  });

  const title =
    !session.title
      ? userText.length > 48
        ? `${userText.slice(0, 45)}…`
        : userText
      : undefined;

  await prisma.mechaChatSession.update({
    where: { id: sessionId },
    data: {
      ...(title !== undefined ? { title } : {}),
      updatedAt: new Date(),
    },
  });

  const dbMessages = await prisma.mechaChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  const history: ChatMessage[] = dbMessages.map((m) => ({
    role: m.role === MechaChatRole.USER ? "user" : "assistant",
    content: m.content,
  }));

  let assistantText: string;
  try {
    assistantText = await completeMechaChat(systemPrompt, history);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "对话失败";
    console.error("[mecha-chat] chat completion failed:", e);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  if (!assistantText) {
    console.error("[mecha-chat] empty assistant content after completion");
    return NextResponse.json({ error: "模型未返回内容" }, { status: 502 });
  }

  const assistantRow = await prisma.mechaChatMessage.create({
    data: {
      sessionId,
      role: MechaChatRole.ASSISTANT,
      content: assistantText,
    },
  });

  await prisma.mechaChatSession.update({
    where: { id: sessionId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    userMessage: {
      id: userRow.id,
      role: "USER",
      content: userText,
    },
    assistantMessage: {
      id: assistantRow.id,
      role: "ASSISTANT",
      content: assistantText,
      createdAt: assistantRow.createdAt.toISOString(),
    },
  });
}
