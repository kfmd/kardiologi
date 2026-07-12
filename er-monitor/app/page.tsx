import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">ICU / ER Patient Monitor Simulator</h1>
      <p className="text-gray-400 max-w-md text-center">
        Educational multiparameter monitor simulator for ACLS, ATLS, PALS, and critical care training.
      </p>
      <div className="flex gap-4">
        <Link href="/monitor" className="bg-green-600 px-5 py-2 rounded font-semibold">
          Student Monitor
        </Link>
        <Link href="/admin" className="bg-blue-600 px-5 py-2 rounded font-semibold">
          Instructor Login
        </Link>
      </div>
    </div>
  );
}
