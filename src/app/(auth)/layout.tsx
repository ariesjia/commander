import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-p-bg px-4 py-8 safe-area-top">
      <Image src="/logo.svg" alt="" width={72} height={72} className="mb-6 shrink-0" />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
