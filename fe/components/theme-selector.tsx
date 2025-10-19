"use client";

import { useTheme } from "next-themes";
import { Dispatch, SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";


type Last<T extends any[]> = T extends [...infer _, infer L] ? L : never;


type Props = {
    getter: boolean;
    setter: Dispatch<SetStateAction<boolean>>;
} & (
        {
            kind: 'sheet';
            side?: Last<Parameters<typeof SheetContent>>['side'];
        } | {
            kind: 'drawer';
            direction?: Last<Parameters<typeof Drawer>>['direction'];
        }
    )


export function ThemeSelector(props: Props) {
    const { theme, themes, setTheme } = useTheme();
    const [themeSelected, setThemeSelected] = useState<string>();

    const staticText = {
        title: 'Themes',
        description: <>Choose the theme your prefer. Current theme: {theme}</>,
        btn: {
            confirm: 'Save theme',
            cancel: 'Cancel'
        }
    } as const;

    function ConfirmTheme() {
        if (themeSelected === undefined) return;
        setTheme(themeSelected);
    }

    const MainContent = (
        <div>
            <ScrollArea className="max-h-96">
                <div className="flex flex-wrap gap-4 justify-center items-center">
                    {
                        themes.map(t => (
                            <Card
                                data-theme={t}
                                className={cn('hover:cursor-pointer hover:border hover:border-primary', themeSelected == t ? 'border border-primary' : '')}
                                key={`theme-selector-component-${t}`}
                                onClick={() => setThemeSelected(t)}
                            >
                                <CardHeader>
                                    <CardTitle className="capitalize">{t.replace(/[^0-9a-z]/gi, ' ')}</CardTitle>
                                    <CardDescription></CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-2 *:size-8 *:rounded-full">
                                        <div className="bg-primary"></div>
                                        <div className="bg-secondary"></div>
                                        <div className="bg-accent"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    }
                </div>
            </ScrollArea>
        </div>
    )

    switch (props.kind) {
        case 'drawer':
            return (
                <Drawer open={props.getter} onOpenChange={props.setter} direction={props.direction}>
                    <DrawerContent>
                        <DrawerHeader>
                            <DrawerTitle>{staticText.title}</DrawerTitle>
                            <DrawerDescription>{staticText.description}</DrawerDescription>
                        </DrawerHeader>
                        {MainContent}

                        <DrawerFooter className={cn(['top', 'bottom'].includes(props.direction ?? '') ? "grid grid-cols-2" : '')}>
                            <DrawerClose asChild>
                                <Button variant="outline">{staticText.btn.cancel}</Button>
                            </DrawerClose>
                            <Button onClick={() => ConfirmTheme()} disabled={themeSelected === undefined || themeSelected == theme}>{staticText.btn.confirm}</Button>
                        </DrawerFooter>

                    </DrawerContent>
                </Drawer>
            )
        case 'sheet':
            return (
                <Sheet open={props.getter} onOpenChange={props.setter}>
                    <SheetContent className="w-[400px] sm:w-[540px]" side={props.side}>
                        <SheetHeader>
                            <SheetTitle>{staticText.title}</SheetTitle>
                            <SheetDescription>{staticText.description}</SheetDescription>
                        </SheetHeader>
                        {MainContent}
                        <SheetFooter className={cn(['top', 'bottom'].includes(props.side ?? '') ? "grid grid-cols-2" : '')}>
                            <SheetClose asChild>
                                <Button variant="outline">{staticText.btn.cancel}</Button>
                            </SheetClose>
                            <Button onClick={() => ConfirmTheme()} disabled={themeSelected === undefined || themeSelected == theme}>{staticText.btn.confirm}</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            )
        default:
            return <></>
    }
}
