import { EntityText } from "@/sanity/EntityText";

export default function Footer() {
  return (
    <footer className="border-t-8 border-black bg-zinc-900 text-zinc-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center bg-red-600 text-xs font-black text-white">
              CWN
            </div>
            <p className="text-xl font-black uppercase tracking-tighter text-white">
              CWN Live
            </p>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
            <EntityText>
              Live markets and cybersecurity coverage. This briefing covers the
              reported Edward Jones compromise in Louisiana, Iranian-linked
              actors, advisor Beau Wilson under investigation, and losses
              upwards of $1.3 billion.
            </EntityText>
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
            Sections
          </p>
          <ul className="mt-3 space-y-2 text-sm font-medium">
            <li>Markets</li>
            <li>Cybersecurity</li>
            <li>Business</li>
            <li>
              <EntityText>Louisiana</EntityText>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
            Report fraud
          </p>
          <ul className="mt-3 space-y-2 text-sm font-medium">
            <li>FTC — reportfraud.ftc.gov</li>
            <li>
              <EntityText>Do not contact Beau Wilson or advisors</EntityText>
            </li>
            <li>
              <EntityText>Louisiana branches under audit</EntityText>
            </li>
            <li>Keep call logs and wire records</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 sm:flex-row sm:justify-between">
          <p>© 2026 CWN Live. All rights reserved.</p>
          <p>Developing story — details may change</p>
        </div>
      </div>
    </footer>
  );
}
