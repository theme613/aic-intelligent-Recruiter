"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none data-[variant=brutalist]:rounded-none",
  {
    variants: {
      variant: {
        default:
          "bg-muted group-data-horizontal/tabs:h-8",
        line: "gap-1 bg-transparent group-data-horizontal/tabs:h-8",
        brutalist:
          "h-auto min-h-[48px] w-full gap-0 rounded-none border-b border-black bg-white p-0 sm:min-h-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        /* default + line variants */
        "group-data-[variant=default]/tabs-list:h-[calc(100%-1px)] group-data-[variant=line]/tabs-list:h-[calc(100%-1px)] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-active:bg-background group-data-[variant=default]/tabs-list:data-active:text-foreground group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:shadow-none",
        "group-data-[variant=default]/tabs-list:after:absolute group-data-[variant=line]/tabs-list:after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:after:inset-x-0 group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:after:bottom-[-5px] group-data-horizontal/tabs:group-data-[variant=default]/tabs-list:after:h-0.5 group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:inset-x-0 group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:bottom-[-5px] group-data-horizontal/tabs:group-data-[variant=line]/tabs-list:after:h-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        /* brutalist: equal-height cells; divider only on list bottom; active tab covers it */
        "group-data-[variant=brutalist]/tabs-list:h-full group-data-[variant=brutalist]/tabs-list:min-h-0 group-data-[variant=brutalist]/tabs-list:rounded-none group-data-[variant=brutalist]/tabs-list:border-0 group-data-[variant=brutalist]/tabs-list:border-r group-data-[variant=brutalist]/tabs-list:border-black group-data-[variant=brutalist]/tabs-list:bg-white group-data-[variant=brutalist]/tabs-list:py-3 group-data-[variant=brutalist]/tabs-list:text-[10px] group-data-[variant=brutalist]/tabs-list:font-medium group-data-[variant=brutalist]/tabs-list:tracking-wide group-data-[variant=brutalist]/tabs-list:text-black/45 group-data-[variant=brutalist]/tabs-list:shadow-none group-data-[variant=brutalist]/tabs-list:data-active:relative group-data-[variant=brutalist]/tabs-list:data-active:z-10 group-data-[variant=brutalist]/tabs-list:data-active:-mb-px group-data-[variant=brutalist]/tabs-list:data-active:border-b-2 group-data-[variant=brutalist]/tabs-list:data-active:border-b-black group-data-[variant=brutalist]/tabs-list:data-active:bg-black group-data-[variant=brutalist]/tabs-list:data-active:text-white sm:group-data-[variant=brutalist]/tabs-list:py-3.5 sm:group-data-[variant=brutalist]/tabs-list:text-xs sm:group-data-[variant=brutalist]/tabs-list:tracking-[0.15em]",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
