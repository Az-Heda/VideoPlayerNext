import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { GetProps } from "@/lib/config";
import { Dispatch, ReactNode, SetStateAction } from "react"

type Props = {
  content: ReactNode;

  delayDuration?: GetProps<Parameters<typeof Tooltip>>['delayDuration'];
  disableHoverableContent?: GetProps<Parameters<typeof Tooltip>>['disableHoverableContent']
  side?: GetProps<Parameters<typeof TooltipContent>>['side'];
} & ({
  children: ReactNode;
  asChild?: GetProps<Parameters<typeof TooltipTrigger>>['asChild'];
  open?: never;
  setOpen?: never;
} | {
  children?: never;
  asChild?: never;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
})

export function Descript(props: Props) {

  if (props.children === undefined) {
    return (
      <Tooltip open={props.open} onOpenChange={props.setOpen} delayDuration={props.delayDuration} disableHoverableContent={props.disableHoverableContent}>
        <TooltipTrigger></TooltipTrigger>
        <TooltipContent side={props.side}>
          {props.content}
        </TooltipContent>
      </Tooltip>
    )
  }
  return (
    <Tooltip delayDuration={props.delayDuration} disableHoverableContent={props.disableHoverableContent}>
      <TooltipTrigger asChild={props.asChild}>{props.children}</TooltipTrigger>
      <TooltipContent side={props.side}>
        {props.content}
      </TooltipContent>
    </Tooltip>
  )
}