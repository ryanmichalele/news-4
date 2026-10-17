import { useLayoutEffect, useMemo, useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Turnstile from "./components/Turnstile";
import { TURNSTILE_SITE_KEY } from "./config";
import heroArrest from "./assets/hero-arrest.jpg";
import { EntityProvider, EntityText } from "./sanity/EntityText";
import { useStoryContent, type InitialContent } from "./sanity/useStoryContent";
import { resolveEntities } from "./sanity/resolveEntities";
import type { StaticArticle } from "./data/fallback";

type Status = "idle" | "submitting" | "success" | "error";

function AppShell({ article }: { article: StaticArticle }) {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const doubledTicker = [...article.tickerItems, ...article.tickerItems];

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!turnstileToken || status === "submitting") return;

    setStatus("submitting");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: turnstileToken }),
      });
      if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
      setEmail("");
      setTurnstileToken("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 selection:bg-red-600 selection:text-white">
      <Header />

      {/* Breaking marquee */}
      <div className="border-b border-black bg-red-600 text-white">
        <div className="mx-auto flex max-w-7xl items-stretch">
          <div className="flex shrink-0 items-center gap-2 bg-black px-4 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600 live-glow" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.35em]">
              Breaking
            </span>
          </div>
          <div className="relative flex-1 overflow-hidden py-2">
            <div className="animate-marquee flex w-max gap-12 whitespace-nowrap text-xs font-bold uppercase tracking-widest">
              {doubledTicker.map((item, i) => (
                <span key={`${item}-${i}`} className="flex items-center gap-12">
                  <EntityText>{item}</EntityText>
                  <span className="text-white/50">//</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main>
        {/* Hero */}
        <section id="report" className="border-b-8 border-black">
          <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
            <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em]">
              <span className="bg-red-600 px-2 py-1 text-white">
                <EntityText>{article.kicker}</EntityText>
              </span>
              <span className="text-zinc-500">
                <EntityText>{article.section}</EntityText>
              </span>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-500">
                <EntityText>{article.location}</EntityText>
              </span>
              <span className="text-zinc-300">|</span>
              <span className="text-zinc-500">
                <EntityText>{article.readTime}</EntityText>
              </span>
            </div>

            <h1 className="max-w-5xl text-4xl font-black uppercase leading-[0.95] tracking-tighter text-zinc-900 md:text-6xl lg:text-7xl">
              <EntityText>{article.title}</EntityText>
            </h1>

            <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-zinc-600 md:text-2xl">
              <EntityText>{article.dek}</EntityText>
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-t-4 border-black pt-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
              <p>
                By <span className="text-zinc-900">{article.byline}</span>
              </p>
              <span className="text-zinc-300">|</span>
              <p>
                Published <EntityText>{article.published}</EntityText>
              </p>
              <span className="text-zinc-300">|</span>
              <p>
                Updated <EntityText>{article.updated}</EntityText>
              </p>
            </div>

            {/* Hero media */}
            <div className="relative mt-8 overflow-hidden border-8 border-black bg-zinc-900">
              <div className="relative aspect-video">
                <img
                  src={heroArrest}
                  alt=""
                  className="h-full w-full object-cover object-[center_20%] opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <div className="scanlines absolute inset-0 opacity-40" />
                <div className="absolute bottom-0 left-0 right-0 flex flex-col gap-2 p-4 md:flex-row md:items-end md:justify-between md:p-6">
                  <p className="max-w-2xl text-sm font-medium text-white md:text-base">
                    <EntityText>{article.heroCaption}</EntityText>
                  </p>
                  <div className="flex items-center gap-2 self-start bg-red-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.35em] text-white">
                    <span className="h-2 w-2 rounded-full bg-white live-glow" />
                    Live investigation
                  </div>
                </div>
              </div>
            </div>

            {/* Stat strip */}
            <div className="mt-8 grid grid-cols-2 border-4 border-black md:grid-cols-4">
              {article.stats.map((stat, i) => (
                <div
                  key={stat.k}
                  className={`bg-white p-4 ${i % 2 === 1 ? "bg-zinc-100" : ""} ${
                    i < 3 ? "border-r-0 border-black md:border-r-4" : ""
                  } ${i < 2 ? "border-b-4 border-black md:border-b-0" : ""} border-black`}
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                    <EntityText>{stat.k}</EntityText>
                  </p>
                  <p className="mt-1 text-xl font-black uppercase tracking-tighter md:text-2xl">
                    <EntityText>{stat.v}</EntityText>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Body grid */}
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <div className="mb-10 border-l-8 border-red-600 bg-zinc-100 p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                Editor’s note
              </p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-700 md:text-base">
                <EntityText>{article.editorNote}</EntityText>
              </p>
            </div>

            <div className="space-y-12">
              {article.bodySections.map((section, idx) => (
                <section key={section.heading} id={idx === 0 ? "story" : undefined}>
                  <h2 className="border-b-4 border-black pb-3 text-2xl font-black uppercase tracking-tighter md:text-3xl">
                    <EntityText>{section.heading}</EntityText>
                  </h2>
                  <div className="mt-6 space-y-5 text-base leading-relaxed text-zinc-700 md:text-lg">
                    {section.paragraphs.map((paragraph, pIdx) => (
                      <p
                        key={paragraph.slice(0, 40)}
                        className={idx === 0 && pIdx === 0 ? "drop-cap" : ""}
                      >
                        <EntityText>{paragraph}</EntityText>
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Quotes */}
            <div className="mt-12 space-y-6">
              {article.quotes.map((quote) => (
                <blockquote
                  key={quote.text.slice(0, 32)}
                  className="border-l-8 border-red-600 bg-zinc-100 p-6 md:p-8"
                >
                  <p className="text-xl font-black leading-tight tracking-tight text-zinc-900 md:text-2xl">
                    “<EntityText>{quote.text}</EntityText>”
                  </p>
                  <footer className="mt-4 text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                    — <EntityText>{quote.source}</EntityText>
                  </footer>
                </blockquote>
              ))}
            </div>

            {/* Timeline */}
            <section id="timeline" className="mt-16">
              <div className="mb-8 flex items-end justify-between gap-4 border-b-8 border-black pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                    <EntityText>{article.timelineKicker}</EntityText>
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter md:text-4xl">
                    <EntityText>{article.timelineHeading}</EntityText>
                  </h2>
                </div>
              </div>
              <ol className="relative space-y-0 border-l-4 border-black pl-8">
                {article.timeline.map((item, index) => (
                  <li key={item.title} className="relative pb-10 last:pb-0">
                    <span className="absolute -left-[42px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-4 border-black bg-red-600" />
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                      <EntityText>{item.date}</EntityText>
                    </p>
                    <h3 className="mt-1 text-xl font-black uppercase tracking-tighter">
                      {index + 1}. <EntityText>{item.title}</EntityText>
                    </h3>
                    <p className="mt-2 max-w-2xl text-base leading-relaxed text-zinc-600">
                      <EntityText>{item.body}</EntityText>
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Protect */}
            <section id="protect" className="mt-16">
              <div className="overflow-hidden border-8 border-black bg-black text-white">
                <div className="grid lg:grid-cols-2">
                  <div className="border-b-8 border-white/10 p-8 lg:border-b-0 lg:border-r-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-500">
                      <EntityText>{article.protectEyebrow}</EntityText>
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-tighter">
                      <EntityText>{article.protectHeading}</EntityText>
                    </h2>
                    <p className="mt-4 text-sm leading-relaxed text-zinc-300 md:text-base">
                      <EntityText>{article.protectBlurb}</EntityText>
                    </p>
                    <div className="relative mt-6 aspect-video overflow-hidden border-4 border-zinc-700">
                      <img
                        src="https://images.pexels.com/photos/8370962/pexels-photo-8370962.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=600&w=900"
                        alt=""
                        className="h-full w-full object-cover opacity-90"
                      />
                      <div className="scanlines absolute inset-0 opacity-30" />
                    </div>
                  </div>
                  <div id="tips" className="p-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">
                      Safety checklist
                    </h3>
                    <ul className="mt-5 space-y-4">
                      {article.protectionTips.map((tip, i) => (
                        <li
                          key={tip.title}
                          className="flex gap-4 border border-zinc-800 bg-zinc-900 p-4"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-red-600 text-sm font-black">
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-black uppercase tracking-tight text-white">
                              <EntityText>{tip.title}</EntityText>
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                              <EntityText>{tip.text}</EntityText>
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <a
                      href="https://reportfraud.ftc.gov/"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 flex w-full items-center justify-center bg-red-600 px-5 py-4 text-xs font-black uppercase tracking-[0.35em] text-white transition hover:bg-red-700"
                    >
                      File FTC report →
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom line */}
            <section className="mt-16 border-4 border-black p-6 md:p-10">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                <EntityText>{article.bottomLineEyebrow}</EntityText>
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tighter md:text-3xl">
                <EntityText>{article.bottomLineHeading}</EntityText>
              </h2>
              <p className="mt-4 text-base leading-relaxed text-zinc-700 md:text-lg">
                <EntityText>{article.bottomLineBody}</EntityText>
              </p>
              <a
                href="https://reportfraud.ftc.gov/"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.35em] text-white transition hover:bg-red-600"
              >
                ReportFraud.ftc.gov
              </a>
            </section>
          </article>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start lg:col-span-1">
            <div className="border-4 border-black">
              <div className="bg-black px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white">
                  At a glance
                </p>
              </div>
              <dl className="divide-y divide-zinc-200">
                {article.keyFacts.map((fact) => (
                  <div
                    key={fact.label}
                    className="grid grid-cols-[0.9fr_1.1fr] gap-2 px-4 py-3"
                  >
                    <dt className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <EntityText>{fact.label}</EntityText>
                    </dt>
                    <dd className="text-sm font-bold leading-snug text-zinc-900">
                      <EntityText>{fact.value}</EntityText>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-4 border-black bg-red-600 p-5 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-white/80">
                <EntityText>{article.guidanceEyebrow}</EntityText>
              </p>
              <p className="mt-2 text-2xl font-black uppercase leading-none tracking-tighter">
                <EntityText>{article.guidanceHeading}</EntityText>
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/90">
                <EntityText>{article.guidanceBlurb}</EntityText>
              </p>
              <a
                href="https://reportfraud.ftc.gov/"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex bg-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.35em] text-white transition hover:bg-zinc-900"
              >
                ReportFraud.ftc.gov
              </a>
            </div>

            <div className="overflow-hidden border-4 border-black">
              <img
                src="https://images.pexels.com/photos/6266311/pexels-photo-6266311.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=500&w=800"
                alt=""
                className="aspect-video w-full object-cover"
              />
              <div className="p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                  Why it matters
                </p>
                <p className="mt-2 text-lg font-black uppercase leading-tight tracking-tight">
                  <EntityText>{article.whyItMatters}</EntityText>
                </p>
              </div>
            </div>

            <div className="border-4 border-black">
              <div className="border-b-4 border-black bg-zinc-100 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                  Related coverage
                </p>
              </div>
              <ul className="divide-y divide-zinc-200">
                {article.relatedStories.map((story) => (
                  <li
                    key={story.title}
                    className="group cursor-pointer p-4 transition hover:bg-zinc-50"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                      <EntityText>{story.tag}</EntityText>
                    </p>
                    <p className="mt-1 font-bold leading-snug text-zinc-900 group-hover:underline">
                      <EntityText>{story.title}</EntityText>
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                      <EntityText>{story.time}</EntityText> read
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-4 border-dashed border-zinc-400 bg-zinc-100 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-500">
                Scope snapshot
              </p>
              <ul className="mt-3 space-y-2 text-sm font-bold text-zinc-800">
                {article.scopeItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-2 w-2 shrink-0 bg-red-600" />
                    <EntityText>{item}</EntityText>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>

        {/* Newsletter */}
        <section className="border-y-8 border-black bg-zinc-100">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 md:flex-row md:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-red-600">
                <EntityText>{article.newsletterKicker}</EntityText>
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase tracking-tighter text-zinc-900">
                <EntityText>{article.newsletterHeading}</EntityText>
              </h2>
              <p className="mt-2 max-w-xl text-sm font-medium text-zinc-600">
                <EntityText>{article.newsletterBlurb}</EntityText>
              </p>
            </div>
            <form
              className="flex w-full max-w-md flex-col gap-3"
              onSubmit={handleSubscribe}
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full border-4 border-black bg-white px-4 py-3 text-sm font-medium outline-none focus:border-red-600"
                />
                <button
                  type="submit"
                  disabled={status === "submitting" || !turnstileToken}
                  className="bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-[0.35em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-zinc-400"
                >
                  {status === "submitting" ? "Sending" : "Notify me"}
                </button>
              </div>

              <Turnstile
                siteKey={TURNSTILE_SITE_KEY}
                onVerify={(token) => {
                  setTurnstileToken(token);
                  setStatus("idle");
                }}
                onExpire={() => {
                  setTurnstileToken("");
                  setStatus("idle");
                }}
                onError={() => {
                  setTurnstileToken("");
                  setStatus("error");
                }}
              />

              <p
                aria-live="polite"
                className="min-h-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500"
              >
                {status === "success"
                  ? "You're on the list. Watch your inbox."
                  : status === "error"
                    ? "Something went wrong. Please try again."
                    : ""}
              </p>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function App({
  initialContent,
}: {
  initialContent?: InitialContent;
}) {
  const { article, entities } = useStoryContent(initialContent);

  // Keep the tab title and meta description in step with the CMS copy, run
  // through the same entity substitution the page body uses.
  const resolvedTitle = useMemo(
    () => resolveEntities(article.title, entities),
    [article.title, entities],
  );
  const resolvedDescription = useMemo(
    () => resolveEntities(article.dek, entities),
    [article.dek, entities],
  );

  useLayoutEffect(() => {
    if (resolvedTitle) document.title = resolvedTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && resolvedDescription) {
      meta.setAttribute("content", resolvedDescription);
    }
  }, [resolvedTitle, resolvedDescription]);

  return (
    <EntityProvider entities={entities}>
      <AppShell article={article} />
    </EntityProvider>
  );
}