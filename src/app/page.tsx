import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background">
      <Image
        src="/buzlee-logo-light.svg"
        alt="Buzlee"
        width={280}
        height={180}
        priority
      />
    </div>
  );
}
