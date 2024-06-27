import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <main className="flex flex-col items-center justify-between p-8">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-gradient-to-t from-white via-white dark:from-black dark:via-black lg:static lg:size-auto lg:bg-none">
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="/"
            rel="noopener noreferrer"
          >
            <Image
              src="/white_logo.png"
              alt="rdmt Logo"
              width={40}
              height={40}
              priority
              style={{ width: 'auto' }}
            />
          </a>
        </div>
        <div className="flex flex-row space-x-8">
          <Link href="/">
            <p className="text-sm cursor-pointer left-0 top-0 flex justify-center pt-2 border-b border-transparent hover:border-white">
              Dashboard
            </p>
          </Link>
          <Link href="/yield-op">
            <p className="text-sm cursor-pointer left-0 top-0 flex justify-center pt-2 border-b border-transparent hover:border-white">
              Yield OP
            </p>
          </Link>
          <Link href="/info">
            <p className="text-sm cursor-pointer left-0 top-0 flex justify-center pt-2 border-b border-transparent hover:border-white">
              Info
            </p>
          </Link>
          <Link href="/about">
            <p className="text-sm cursor-pointer left-0 top-0 flex justify-center pt-2 border-b border-transparent hover:border-white">
              About
            </p>
          </Link>
          <Link href="/bubbles">
            <p className="text-sm cursor-pointer left-0 top-0 flex justify-center pt-2 border-b border-transparent hover:border-white">
              Bubbles
            </p>
          </Link>
        </div>

        <div className="flex flex-row">
          <p className="text-sm cursor-pointer left-0 top-0 flex justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
            Connect Wallet{' '}
          </p>
        </div>
      </div>

      <div className="mt-16 relative z-[-1] flex place-items-center before:absolute before:h-[300px] before:w-full before:-translate-x-1/2 before:rounded-full before:bg-gradient-radial before:from-white before:to-transparent before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-full after:translate-x-1/3 after:bg-gradient-conic after:from-sky-200 after:via-blue-200 after:blur-2xl after:content-[''] before:dark:bg-gradient-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-sky-900 after:dark:via-[#0141ff] after:dark:opacity-40 sm:before:w-[480px] sm:after:w-[240px] before:lg:h-[360px]"></div>
    </main>
  );
}
