import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { Component, ComponentProps, JSX, ReactNode } from "react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";


type ShowIfProps = {
  cond: Boolean;
  children: ReactNode;
  fallback?: ReactNode | undefined;
}
export function ShowIf(props: ShowIfProps) {
  return <>
    {props.cond}
    ? <>{props.children}</>
    : {props.fallback != undefined}
    ?<>{props.fallback}</>
    : <></>
  </>
}

export function RatingStars(n: number) {
  const rating = Math.round(n * 2) / 2;

  return Array.from({ length: 5 }, (_, i) => {
    const fill = Math.max(0, Math.min(1, rating - i));

    return (
      <div key={i} className="relative h-5 w-5">
        {/* Empty star */}
        <Star className="absolute h-5 w-5 fill-transparent stroke-primary" />

        {/* Filled portion */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${fill * 100}%` }}
        >
          <Star className="h-5 w-5 fill-primary stroke-primary" />
        </div>
      </div>
    );
  });
}

type TypographyProps = {
  className?: string;
  children: ReactNode;
} & (
    { kind?: 'h1', props?: Omit<ComponentProps<'h1'>, 'className'> } |
    { kind?: 'h2', props?: Omit<ComponentProps<'h2'>, 'className'> } |
    { kind?: 'h3', props?: Omit<ComponentProps<'h3'>, 'className'> } |
    { kind?: 'p', props?: Omit<ComponentProps<'p'>, 'className'> } |
    { kind?: 'a', props?: Omit<ComponentProps<'a'>, 'className'> } |
    { kind?: 'ul', props?: Omit<ComponentProps<'ul'>, 'className'> } |
    { kind?: 'code', props?: Omit<ComponentProps<'code'>, 'className'> } |
    { kind?: 'blockquote', props?: Omit<ComponentProps<'blockquote'>, 'className'> }
  );

export function Typography(props: TypographyProps) {
  switch (props.kind) {
    case 'h1':
      return <h1
        {...props.props ?? {}}
        className={cn("scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl", props.className)}
      >
        {props.children}
      </h1>

    case 'h2':
      return <h2
        {...props.props ?? {}}
        className={cn("mt-10 scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0", props.className)}
      >
        {props.children}
      </h2>

    case 'h3':
      return < h3
        {...props.props ?? {}}
        className={cn("mt-8 scroll-m-20 text-2xl font-semibold tracking-tight", props.className)}
      >
        {props.children}
      </h3 >

    case 'p':
      return <p
        {...props.props ?? {}}
        className={cn("leading-7 not-first:mt-6", props.className)}
      >
        {props.children}
      </p>

    case 'a':
      return <a
        {...props.props ?? {}}
        className={cn("font-medium text-primary underline underline-offset-4", props.className)}
      >
        {props.children}
      </a>
    case 'ul':
      return <ul
        {...props.props ?? {}}
        className={cn("my-6 ml-6 list-disc [&>li]:mt-2", props.className)}
      >
        {props.children}
      </ul>

    case 'code':
      return <code
        {...props.props ?? {}}
        className={cn("relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold", props.className)}
      >
        {props.children}
      </code>

    case 'blockquote':
      return <blockquote
        {...props.props ?? {}}
        className="mt-6 border-l-2 pl-6 italic"
      >
        {props.children}
      </blockquote>

    default:
      return <div className={props.className}>{props.children}</div>
  }
}

type DescriptionProps = {
  text: ReactNode;
  children: ReactNode;
  asChild?: boolean;
  openDelay?: ComponentProps<typeof HoverCard>['openDelay'];
  closeDelay?: ComponentProps<typeof HoverCard>['closeDelay'];
  align?: ComponentProps<typeof HoverCardContent>['align'];
  alignOffset?: ComponentProps<typeof HoverCardContent>['alignOffset'];
}
export function Description(props: DescriptionProps) {
  return <HoverCard openDelay={props.openDelay} closeDelay={props.closeDelay}>
    <HoverCardTrigger asChild={props.asChild}>
      {props.children}
    </HoverCardTrigger>
    <HoverCardContent align={props.align} alignOffset={props.alignOffset}>
      {props.text}
    </HoverCardContent>
  </HoverCard >
}