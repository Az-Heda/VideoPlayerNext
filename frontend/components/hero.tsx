import { ArrowRight } from "lucide-react"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Separator } from "./ui/separator"
import { GlobalConfigType } from "@/lib/globals"
import { useMemo } from "react"
import { Spinner } from "./ui/spinner"
import { displayNumber } from "@/lib/utils"

type KPI = {
  Label: string;
  Value: number | undefined;
}

type HeroProps = {
  Config: GlobalConfigType
}
export function Hero(props: HeroProps) {
  const kpis: KPI[] = useMemo((): KPI[] => {
    return [
      { Label: 'Folders', Value: props.Config.Api.Data.Folders.Getter?.length },
      { Label: 'Videos', Value: props.Config.Api.Data.Videos.Getter?.length },
      { Label: 'Playlists', Value: props.Config.Api.Data.Playlists.Getter?.length },
      { Label: 'Tags', Value: props.Config.Api.Data.Tags.Getter?.length },
      { Label: 'Automatic Rules', Value: props.Config.Api.Data.Rules.Getter?.length },
      { Label: 'System Logs', Value: props.Config.Api.Data.SystemLogs.Getter?.length },
    ];
  }, [
    props.Config.Api.Data.Folders.Getter,
    props.Config.Api.Data.Playlists.Getter,
    props.Config.Api.Data.Rules.Getter,
    props.Config.Api.Data.SystemLogs.Getter,
    props.Config.Api.Data.Tags.Getter,
    props.Config.Api.Data.Videos.Getter,
  ])
  return <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 md:grid-cols-2 md:items-center md:gap-16">
      <div className="flex flex-col">
        <Badge variant="outline" className="w-fit">
          Version 2.0
        </Badge>

        <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
          Video Player
          {/* <br className="hidden sm:block" /> built for scale. */}
        </h1>

        <p className="mt-5 text-lg text-muted-foreground">
          Simple, fast, and privacy-focused video player that lets you play videos directly from your device.
          No uploads, no accounts, and no unnecessary setup — just select a video and start watching.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          {props.Config.Pages.All.filter(x => x.Id != 'homepage').map((page) => (
            <Button key={page.Id} onClick={() => props.Config.Pages.Current.Setter(page.Id)}>
              {page.Label}
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
          ))}
        </div>

        <Separator className="my-8" />
      </div>

      <div className="relative">
        <div className="rounded-lg border border-border bg-card p-1">
          <div className="flex items-center gap-1.5 rounded-t-md border-b border-border bg-muted px-3 py-2">
            <span className="size-2.5 border border-border bg-background" />
            <span className="size-2.5 border border-border bg-background" />
            <span className="size-2.5 border border-border bg-background" />
            <span className="ml-3 h-4 flex-1 rounded-md border border-border bg-background" />
          </div>

          <div className="flex flex-col gap-0 rounded-b-md bg-background p-4">
            <div className="grid grid-cols-2 gap-3">
              {kpis.map((row) => (
                <div
                  key={row.Label}
                  className="flex flex-col rounded-lg border border-border bg-card p-3"
                >
                  <p className="text-xs text-muted-foreground">{row.Label}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums">
                    {
                      row.Value !== undefined
                        ? displayNumber(row.Value)
                        : <span className="flex items-center justify-start gap-2 text-xs"><Spinner /> Loading...</span>
                    }
                  </p>
                </div>
              ))}
            </div>

            {/* <div className="mt-3 rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold">Revenue over time</p>
                <Badge variant="secondary" className="text-xs">
                  Last 12 months
                </Badge>
              </div>
              <div className="flex h-28 items-end gap-1">
                {BAR_HEIGHTS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-foreground/15"
                    style={{ height: `${h}%` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between">
                {["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => (
                  <span key={m} className="text-xs text-muted-foreground">
                    {m}
                  </span>
                ))}
              </div>
            </div> */}

            {/* <div className="mt-3 rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <p className="text-xs font-semibold">Top channels</p>
              </div>
              {[
                { name: "Organic search", pct: 74, sessions: "2,841" },
                { name: "Direct", pct: 53, sessions: "2,032" },
                { name: "Referral", pct: 31, sessions: "1,190" },
              ].map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-3 border-b border-border px-4 py-2 last:border-0"
                >
                  <span className="w-24 truncate text-xs">{row.name}</span>
                  <div className="flex-1 border border-border bg-muted">
                    <div
                      className="h-1.5 bg-foreground/40"
                      style={{ width: `${row.pct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {row.sessions}
                  </span>
                </div>
              ))}
            </div> */}
          </div>
        </div>

        <div
          className="absolute -right-3 -bottom-3 -z-10 size-full rounded-lg border border-border bg-muted"
          aria-hidden="true"
        />
      </div>
    </div>
  </section>
}