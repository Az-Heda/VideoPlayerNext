import { GlobalConfigType, KeybindLS } from "@/lib/globals";
import { ComponentProps, Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, ApiFolder, ApiVideo, GenericError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, CloudBackup, Edit2, Play, Plus, RefreshCcw, RefreshCw, Trash2, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/utility";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { CommandShortcut } from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { EditKeyInput, KeyKeyboard } from "./commons";

type CommonProps = {
  Config: GlobalConfigType;
}

type GeneralModalProps = CommonProps & {
  title?: ReactNode;
  description?: ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
  confirmBtn?: ReturnType<typeof Button>;
  cancelBtn?: ReturnType<typeof Button>;
  className?: string;
} & (
    | { kind: 'dialog', side?: string; }
    | { kind: 'sheet', side?: ComponentProps<typeof SheetContent>['side']; }
    | { kind: 'drawer', side?: ComponentProps<typeof Drawer>['direction']; }
  );

type ModalImportFromFileProps = CommonProps & {};
type ModalImportFromUrlProps = CommonProps & {};
type ModalAudioContextProps = CommonProps & {};
type ModalThemeSelectorProps = CommonProps & {};
type ModalKeybindsProps = CommonProps & {};
type ModalSettingsProps = CommonProps & {};
type ModalSyncVideosProps = CommonProps & {};
type ModalSyncDataProps = CommonProps & {};
type ModalApplyAutomaticRules = CommonProps & {};
type ErrorModalProps = CommonProps & {};
type PlaylistSelectorProps = CommonProps & {};
type TagSelectorProps = CommonProps & {};

export function GeneralModal(props: GeneralModalProps) {
  switch (props.kind) {
    case 'sheet':
      return <Sheet open={props.open} onOpenChange={props.setOpen}>
        <SheetContent side={props.side} className={cn(props.className)}>
          <SheetHeader>
            <SheetTitle>{props.title ?? ''}</SheetTitle>
            <SheetDescription>{props.description ?? ''}</SheetDescription>
          </SheetHeader>
          <div className="no-scrollbar overflow-y-auto px-4">
            {props.children}
          </div>
          <SheetFooter>
            {props.cancelBtn && <SheetClose asChild>{props.cancelBtn}</SheetClose>}
            {props.confirmBtn}
          </SheetFooter>
        </SheetContent>
      </Sheet>

    case 'drawer':
      return <Drawer open={props.open} onOpenChange={props.setOpen} direction={props.side}>
        <DrawerContent className={cn(props.className)}>
          <DrawerHeader>
            <DrawerTitle>{props.title ?? ''}</DrawerTitle>
            <DrawerDescription>{props.description ?? ''}</DrawerDescription>
          </DrawerHeader>
          <div className="no-scrollbar overflow-y-auto px-4">
            {props.children}
          </div>
          <DrawerFooter>
            {props.cancelBtn && <DrawerClose asChild>{props.cancelBtn}</DrawerClose>}
            {props.confirmBtn}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

    case 'dialog':
      return <Dialog open={props.open} onOpenChange={props.setOpen}>
        <DialogContent className={cn(props.className)}>
          <DialogHeader>
            <DialogTitle>{props.title ?? ''}</DialogTitle>
            <DialogDescription>{props.description ?? ''}</DialogDescription>
          </DialogHeader>
          {props.children}
          <DialogFooter>
            {props.cancelBtn && <DialogClose asChild>{props.cancelBtn}</DialogClose>}
            {props.confirmBtn}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    default:
      return <></>
  }
}

export function ModalImportFromFile(props: ModalImportFromFileProps) {
  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Top.FromFileModal.Getter}
    setOpen={props.Config.Sidebar.Top.FromFileModal.Setter}
    title="Import from file"
    description="Choose a video on disk to play"
    cancelBtn={<Button variant="outline">Cancel</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    Not implemented
  </GeneralModal>
}

export function ModalImportFromUrl(props: ModalImportFromUrlProps) {
  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Top.FromUrlModal.Getter}
    setOpen={props.Config.Sidebar.Top.FromUrlModal.Setter}
    title="Import from url"
    description={<>Import video from link<br />
      [Note]: Audio Context doesn't work for videos imported from url</>}
    cancelBtn={<Button variant="outline">Cancel</Button>}
    confirmBtn={<Button type="submit">Confirm</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    Not implemented yet
  </GeneralModal>
}

export function ModalAudioContext(props: ModalAudioContextProps) {
  const [doEnable, setDoEnable] = useState<boolean>(false);
  useEffect(() => {
    if (!doEnable) return;
    if (props.Config.VideoPlayer.AudioContext.Enabled.Getter) return;
    props.Config.VideoPlayer.AudioContext.Enabled.Setter(true);
    console.log("Enabled")
    const interval = setInterval(() => {
      const video = document.querySelector<HTMLVideoElement>('video#video-stream');
      if (video == null) return;

      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(video);
      const gn = ctx.createGain();
      source.connect(gn);

      gn.connect(ctx.destination);
      props.Config.VideoPlayer.AudioContext.GainNode.Setter(gn);
      clearInterval(interval);
    })
  }, [doEnable])

  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Top.AudioContextModal.Getter}
    setOpen={props.Config.Sidebar.Top.AudioContextModal.Setter}
    title="Audio Context"
    description="Initialize and use AudioContext to increase the max volume availabale"
    cancelBtn={<Button variant="outline">Close</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    {!props.Config.VideoPlayer.AudioContext.Enabled.Getter && <Button className="w-full" onClick={() => { setDoEnable(true) }}>Enable</Button>}
    {props.Config.VideoPlayer.AudioContext.Enabled.Getter && <Typography>
      Set the limits of the audio context.
      <ButtonGroup className="w-full grid grid-cols-6">
        {
          props.Config.VideoPlayer.AudioContext.Limits.Getter.map(l => (
            <Button
              key={l}
              variant={props.Config.VideoPlayer.AudioContext.SelectedLimit.Getter == l ? 'default' : 'outline'}
              onClick={() => props.Config.VideoPlayer.AudioContext.SelectedLimit.Setter(l)}
            >
              {l}%
            </Button>
          ))
        }
      </ButtonGroup>
    </Typography>}
  </GeneralModal>
}

export function ModalThemeSelector(props: ModalThemeSelectorProps) {
  const { theme, themes, setTheme } = useTheme();
  const [themeSelected, setThemeSelected] = useState<string>();

  const themeSelectedDisplay = useMemo(() => {
    if (themeSelected === undefined) return '';
    return '(' + themeSelected + ')';
  }, [themeSelected])

  function ConfirmTheme() {
    if (themeSelected === undefined) return;
    setTheme(themeSelected);
    setThemeSelected(undefined);
  }

  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.ThemeModal.Getter}
    setOpen={props.Config.Sidebar.Bottom.ThemeModal.Setter}
    title="Theme selector"
    cancelBtn={<Button variant="outline">Cancel</Button>}
    confirmBtn={<Button onClick={() => ConfirmTheme()}>Confirm</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    <div>
      Choose the website theme.<br />
      Current: {theme} {themeSelectedDisplay}

      <ScrollArea>
        <div className="flex flex-wrap gap-4 justify-center items-center mt-4 mx-2">
          {themes.map(t => (
            <Card
              key={t}
              data-theme={t}
              className="hover:cursor-pointer border border-primary"
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
          ))}
        </div>
      </ScrollArea>

    </div>
  </GeneralModal>
}

export function ModalKeybinds(props: ModalKeybindsProps) {
  const [editMode, setEditMode] = useState<string>();

  type LSStore = { [key: string]: KeybindLS };
  const LSKey = 'custom-keybinds';
  let lastSaved = '';
  const saveItem = useMemo(() => {
    return Object.fromEntries(Object.entries(props.Config.Keybinds.Getter)
      .filter((v) => v[1].Custom != undefined && JSON.stringify(v[1].Default) != JSON.stringify(v[1].Custom))
      .map(([k, v]) => {
        return [k, v.Custom ?? v.Default];
      }))
  }, [props.Config.Keybinds.Getter])


  function overwrite(id: string, kb: KeybindLS) {
    props.Config.Keybinds.Setter(current => Object.fromEntries(Object.entries(current).map(([k, v]) => {
      if (k !== id) return [k, v];
      console.log({ id, kb, k, v })
      return [k, { ...v, Custom: kb }]
    })));

    setEditMode(undefined);
  }

  function readFromLS() {
    const currentValue = localStorage.getItem(LSKey);
    if (currentValue == null) return;
    const parsed = JSON.parse(currentValue) as LSStore;
    const overwriteKeys = Object.keys(parsed);
    props.Config.Keybinds.Setter(current => Object.fromEntries(Object.entries(current).map(([k, v]) => {
      if (!overwriteKeys.includes(k)) return [k, v];
      return [k, { ...v, Custom: parsed[k] }]
    })))
  }

  function reset(id: string) {
    props.Config.Keybinds.Setter(current => Object.fromEntries(Object.entries(current).map(([k, v]) => {
      if (k != id) return [k, v]
      return [k, { ...v, Custom: undefined }];
    })))
  }

  useEffect(() => {
    readFromLS();
  }, []);

  useEffect(() => {
    if (JSON.stringify(saveItem) == lastSaved) return;
    lastSaved = JSON.stringify(saveItem);
    window.localStorage.setItem(LSKey, lastSaved);
    setEditMode(undefined);
  }, [saveItem])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const ignoreConds: boolean[] = [
        target.tagName == 'INPUT',
        target.tagName == 'TEXTAREA',
        target.isContentEditable,
      ]
      if (ignoreConds.some(Boolean)) return;

      for (const v of Object.values(props.Config.Keybinds.Getter)) {
        const command = v.Custom ?? v.Default;
        const conds: boolean[] = [
          event.key.toUpperCase() == command.Key?.toUpperCase(),
          event.ctrlKey == (!!command.Ctrl),
          event.altKey == (!!command.Alt),
          event.shiftKey == (!!command.Shift),
          event.metaKey == (!!command.Meta),
        ];
        if (conds.every(Boolean)) {
          if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey || event.key.length > 1) event.preventDefault();
          v.Action()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [props.Config.Keybinds.Getter]);

  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.KeybindsModal.Getter}
    setOpen={props.Config.Sidebar.Bottom.KeybindsModal.Setter}
    title="Keybinds"
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
    className={props.Config.Settings.ModalKind.Getter == 'dialog' ? 'max-w-135!' : ''}
  >
    <Table>

      <TableHeader>
        <TableRow className="*:text-center">
          <TableHead>Command</TableHead>
          <TableHead>Shortcut</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {Object.entries(props.Config.Keybinds.Getter).map(([k, v]) => (
          <TableRow key={k}>
            <TableCell>{k}</TableCell>
            <TableCell>
              {
                editMode === k
                  ? <EditKeyInput id={k} changed={(kb) => { overwrite(k, kb) }} />
                  : <KeyKeyboard {...(v.Custom ?? v.Default)} />
              }
            </TableCell>
            <TableCell>
              <ButtonGroup className="w-full">
                {
                  editMode !== k && <>
                    <Button variant="outline" onClick={() => v.Action()}>
                      <Play />
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(k)}>
                      <Edit2 />
                    </Button>
                  </>
                }

                <Button variant="outline" disabled={editMode === k ? false : v.Custom == undefined} onClick={() => reset(k)}>
                  <Trash2 />
                </Button>
              </ButtonGroup>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

    </Table>
  </GeneralModal>
}

export function ModalSettings(props: ModalSettingsProps) {
  const LS_Key = "vp-settings"
  const [settingsModalKind, setSettingsModalKind] = useState<typeof props.Config.Settings.ModalKind.Getter>(props.Config.Settings.ModalKind.Getter);
  const [settingsModalSide, setSettingsModalSide] = useState<typeof props.Config.Settings.ModalSide.Getter>(props.Config.Settings.ModalSide.Getter);
  const [settingsVideoPrivacyMode, setSettingsVideoPrivacyMode] = useState<typeof props.Config.Settings.PrivacyVideoMode.Getter>(false);
  const [settingsShowScalarApi, setSettingsShowScalarApi] = useState<typeof props.Config.Settings.ShowScalarApi.Getter>(props.Config.Settings.ShowScalarApi.Getter);
  const [coloredWatchedStatus, setColoredWatchedStatus] = useState<typeof props.Config.Settings.ColoredWatchedStatus.Getter>(props.Config.Settings.ColoredWatchedStatus.Getter)
  const [localApiOrigin, setLocalApiOrigin] = useState<typeof props.Config.Settings.ApiHostUrl.Getter>(props.Config.Settings.ApiHostUrl.Getter);
  const [localDevMode, setLocalDevMode] = useState<typeof props.Config.Settings.DevelopmentMode.Getter>(props.Config.Settings.DevelopmentMode.Getter);

  const allSettings = useMemo(() => {
    return {
      settingsModalKind,
      settingsModalSide,
      settingsVideoPrivacyMode,
      settingsShowScalarApi,
      coloredWatchedStatus,
      localApiOrigin,
      localDevMode,
    }
  }, [
    settingsModalKind,
    settingsModalSide,
    settingsVideoPrivacyMode,
    settingsShowScalarApi,
    coloredWatchedStatus,
    localApiOrigin,
    localDevMode,
  ])

  function reset() {
    const stored = window.localStorage.getItem(LS_Key);
    if (typeof stored == 'string') {
      const settings = JSON.parse(stored) as typeof allSettings;
      setSettingsModalKind(settings.settingsModalKind);
      setSettingsModalSide(settings.settingsModalSide);
      setSettingsVideoPrivacyMode(settings.settingsVideoPrivacyMode);
      setSettingsShowScalarApi(settings.settingsShowScalarApi);
      setColoredWatchedStatus(settings.coloredWatchedStatus);
      setLocalApiOrigin(settings.localApiOrigin);
      setLocalDevMode(settings.localDevMode);

      props.Config.Settings.ModalKind.Setter(settings.settingsModalKind);
      props.Config.Settings.ModalSide.Setter(settings.settingsModalSide);
      props.Config.Settings.PrivacyVideoMode.Setter(settings.settingsVideoPrivacyMode);
      props.Config.Settings.ShowScalarApi.Setter(settings.settingsShowScalarApi);
      props.Config.Settings.ColoredWatchedStatus.Setter(settings.coloredWatchedStatus);
      props.Config.Settings.ApiHostUrl.Setter(settings.localApiOrigin);
      props.Config.Settings.DevelopmentMode.Setter(settings.localDevMode);
    } else {
      setSettingsModalKind(props.Config.Settings.ModalKind.Getter);
      setSettingsModalSide(props.Config.Settings.ModalSide.Getter);
      setSettingsVideoPrivacyMode(props.Config.Settings.PrivacyVideoMode.Getter);
      setSettingsShowScalarApi(props.Config.Settings.ShowScalarApi.Getter);
      setColoredWatchedStatus(props.Config.Settings.ColoredWatchedStatus.Getter);
      setLocalApiOrigin(props.Config.Settings.ApiHostUrl.Getter);
      setLocalDevMode(props.Config.Settings.DevelopmentMode.Getter);
    }
  }

  function submit() {
    props.Config.Sidebar.Bottom.SettingsModal.Setter(false);
    saveToLocalStorage();
    reset();
  }

  function saveToLocalStorage() {
    window.localStorage.setItem(LS_Key, JSON.stringify(allSettings))
  }

  useEffect(() => {
    reset();
  }, [props.Config.Sidebar.Bottom.SettingsModal.Getter])


  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.SettingsModal.Getter}
    setOpen={props.Config.Sidebar.Bottom.SettingsModal.Setter}
    title="Settings"
    cancelBtn={<Button variant="outline" onClick={() => reset()}>Cancel</Button>}
    confirmBtn={<Button onClick={() => submit()}>Confirm</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >

    <div className="w-full grid grid-cols-2 justify-between gap-y-2">

      <Marker variant="separator" className="not-first:mt-4 pb-2 col-span-2">
        <MarkerContent>Modals</MarkerContent>
      </Marker>

      <Label htmlFor="settings-kind">Kind</Label>
      <Select value={settingsModalKind} onValueChange={(val) => setSettingsModalKind(val as typeof settingsModalKind)}>
        <SelectTrigger className="w-full">
          <SelectValue id="settings-kind" className="w-full" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="dialog">Dialog</SelectItem>
          <SelectItem value="drawer">Drawer</SelectItem>
          <SelectItem value="sheet">Sheet</SelectItem>
        </SelectContent>
      </Select>

      <Label htmlFor="settings-side">Side</Label>
      <Select
        value={settingsModalSide}
        onValueChange={(val) => setSettingsModalSide(val as typeof settingsModalSide)}
        disabled={settingsModalKind == 'dialog'}
      >
        <SelectTrigger className="w-full">
          <SelectValue id="settings-side" className="w-full" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="top">Top</SelectItem>
          <SelectItem value="right">Right</SelectItem>
          <SelectItem value="bottom">Bottom</SelectItem>
          <SelectItem value="left">Left</SelectItem>
        </SelectContent>
      </Select>

      <Marker variant="separator" className="not-first:mt-4 pb-2 col-span-2">
        <MarkerContent>Video table</MarkerContent>
      </Marker>

      <Label htmlFor="privacyMode">Privacy mode</Label>
      <span className="w-full flex gap-2">
        <Switch checked={settingsVideoPrivacyMode} onCheckedChange={setSettingsVideoPrivacyMode} />
        {settingsVideoPrivacyMode ? 'On' : 'Off'}
      </span>

      <Label>Watched status color mode</Label>
      <ButtonGroup className="w-full grid grid-cols-3">
        <Button onClick={() => { setColoredWatchedStatus('none') }} variant={coloredWatchedStatus == 'none' ? 'default' : 'outline'}>None</Button>
        <Button onClick={() => { setColoredWatchedStatus('border') }} variant={coloredWatchedStatus == 'border' ? 'default' : 'outline'}>Border</Button>
        <Button onClick={() => { setColoredWatchedStatus('full') }} variant={coloredWatchedStatus == 'full' ? 'default' : 'outline'}>Full</Button>
      </ButtonGroup>

      <Marker variant="separator" className="not-first:mt-4 pb-2 col-span-2">
        <MarkerContent>Development mode</MarkerContent>
      </Marker>


      <Label htmlFor="devMode">Dev mode</Label>
      <span className="w-full flex gap-2">
        <Switch checked={localDevMode} onCheckedChange={setLocalDevMode} />
        {localDevMode ? 'On' : 'Off'}
      </span>
      {
        localDevMode && <>
          <Label htmlFor="privacyMode">Show Scalar API</Label>
          <span className="w-full flex gap-2">
            <Switch checked={settingsShowScalarApi} onCheckedChange={setSettingsShowScalarApi} />
            {settingsShowScalarApi ? 'On' : 'Off'}
          </span>

          <Label>Api origin</Label>
          <ButtonGroup className="w-full">
            <Input
              value={localApiOrigin ?? ''}
              onChange={(e) => setLocalApiOrigin(e.target.value)}
            />
            <Button
              onClick={() => {
                setLocalApiOrigin(window.location.origin);
              }}
            >
              <RefreshCcw />
            </Button>
          </ButtonGroup>
        </>
      }

    </div>

  </GeneralModal>
}

export function ModalApplyAutomaticRules(props: ModalApplyAutomaticRules) {
  const [requestStatus, setRequestStatus] = useState<'not-started' | 'waiting' | 'done'>('not-started');
  const [updatedVideos, setUpdatedVideos] = useState<ApiVideo[]>();

  useEffect(() => {
    setUpdatedVideos(undefined);
    setRequestStatus('not-started');
  }, [props.Config.Sidebar.Top.AutomaticRuleModel.Getter])

  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Top.AutomaticRuleModel.Getter}
    setOpen={props.Config.Sidebar.Top.AutomaticRuleModel.Setter}
    title="Apply automatic rules"
    description="You can apply all of the automatic rules to automatically update playlists and tags"
    cancelBtn={<Button variant="outline">Cancel</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    <div className="flex items-center justify-between">
      <span>
        {
          props.Config.Api.Data.Rules.Getter !== undefined
            ? <>Found {props.Config.Api.Data.Rules.Getter.length} rules</>
            : <>Cannot find any rule</>
        }
      </span>
      <Button
        onClick={() => {
          props.Config.Api.Instance.GetRuleList()
            .then(
              (data) => props.Config.Api.Data.Rules.Setter(data),
              (error) => props.Config.Errors.Setter(errs => [...errs, error])
            );
        }}
      >Refresh rules</Button>
    </div>

    <Button
      className="mt-4 w-full"
      disabled={(props.Config.Api.Data.Rules.Getter?.length ?? 0) == 0 && requestStatus != 'waiting'}
      onClick={() => {
        setRequestStatus('waiting')
        props.Config.Api.Instance.ApplyAutomaticRule()
          .then(
            (updatedVideos) => {
              const updatedVideosObj = Object.fromEntries(updatedVideos.map(v => [v.id, v]));
              const updatedVideosIds = Object.keys(updatedVideosObj);
              setRequestStatus('done')
              setUpdatedVideos(updatedVideos);
              props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : [...videos.map(v => {
                if (!updatedVideosIds.includes(v.id)) return v;
                console.log(v.id, v);
                return updatedVideosObj[v.id];
              }
              )]);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error])
          );
      }}
    >
      {
        requestStatus != 'waiting'
          ? <>Apply rules</>
          : <><Spinner />Applying rules</>
      }
    </Button>

    {
      updatedVideos && <>
        <Marker variant="separator" className="py-4">
          <MarkerContent>Results</MarkerContent>
        </Marker>
        <div>Updated {updatedVideos.length} videos</div>
      </>
    }
  </GeneralModal >
}

export function ModalSyncVideos(props: ModalSyncVideosProps) {
  const [newFolder, setNewFolder] = useState<string>();
  const [step, setStep] = useState<'select' | 'scan' | 'end'>('select');
  const [selectedFolder, setSelectedFolder] = useState<ApiFolder>();
  const [updatedVideos, setUpdatedVideos] = useState<ApiVideo[]>([]);
  const videosRef = useRef<ApiVideo[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>('');

  const isSelectValid = useMemo(() => {
    if (selectedFolder == undefined) return false;
    if (selectedValue == undefined || selectedValue == '') return false;
    return selectedValue == selectedFolder.id;
  }, [selectedValue, selectedFolder])

  useEffect(() => {
    if (selectedValue == undefined || selectedValue == '') return;
    if (props.Config.Api.Data.Folders.Getter == undefined) return;
    const folder = props.Config.Api.Data.Folders.Getter.find(x => x.id == selectedValue);
    if (!folder) return;
    setSelectedFolder(folder);
  }, [props.Config.Api.Data.Folders.Getter, selectedValue]);

  useEffect(() => {
    switch (step) {
      case 'select':
      case 'scan':
      case 'end':
      default:
    }
  }, [step, selectedFolder]);

  useEffect(() => {
    if (step == 'scan') return;
    setStep('select');
    setSelectedFolder(undefined);
    setSelectedValue('');
    setUpdatedVideos([]);
    videosRef.current = [];
  }, [step, props.Config.Sidebar.Top.ScanFolderVideosModal.Getter])


  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Top.ScanFolderVideosModal.Getter}
    setOpen={props.Config.Sidebar.Top.ScanFolderVideosModal.Setter}
    title="Scan folder"
    description={
      step == 'select' ? <>Select the folder you want to fetch the data</>
        : step == 'scan' ? <>Scanning the folder</>
          : step == 'end' ? <>Finish scanning</>
            : <></>
    }
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    {
      step == 'select' ? (
        <>

          Add a new folder to the tracked list
          <ButtonGroup className="w-full">
            <Input
              value={newFolder ?? ''}
              onChange={(e) => setNewFolder(e.target.value)}
            />
            <Button
              size="icon"
              onClick={() => {
                if (!newFolder) return;
                props.Config.Api.Instance.PostFolderNew(newFolder)
                  .then(
                    (folder) => {
                      if (props.Config.Api.Data.Folders.Getter?.length == 0) { setSelectedValue(folder.id) }
                      props.Config.Api.Data.Folders.Setter(folders => folders === undefined ? [folder] : [...folders, folder]);
                      setNewFolder(undefined);
                    },
                    (error) => props.Config.Errors.Setter(errs => [...errs, error]))
              }}
            >
              <Plus />
            </Button>
          </ButtonGroup>

          <Marker variant="separator" className="py-4">
            <MarkerContent>Or</MarkerContent>
          </Marker>

          <Field className="w-full" data-invalid={!isSelectValid}>
            <FieldLabel>Select folder</FieldLabel>
            <ButtonGroup>
              <Select
                value={selectedValue}
                onValueChange={setSelectedValue}
                disabled={props.Config.Api.Data.Folders.Getter?.length == 0}
              >
                <SelectTrigger className="w-full" data-invalid={!isSelectValid}>
                  <SelectValue placeholder="Select folder" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {props.Config.Api.Data.Folders.Getter?.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.fullpath}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                className="text-foreground!"
                aria-invalid={false}
                disabled={props.Config.Api.Data.Folders.Getter?.length == 0}
                onClick={() => {
                  props.Config.Api.Instance.GetFolderList()
                    .then(
                      (data) => props.Config.Api.Data.Folders.Setter(data),
                      (error) => props.Config.Errors.Setter(errs => [...errs, error])
                    )
                }}
              >
                <RefreshCw />
              </Button>
            </ButtonGroup>
            {!isSelectValid && <FieldError>Select a folder to continue</FieldError>}
          </Field>

          <Button
            className="w-full"
            disabled={!isSelectValid}
            onClick={() => {
              if (!selectedFolder) return;
              setStep('scan')
              const source = new EventSource(props.Config.Api.Instance.GetScanFolderStreamUrl(selectedFolder))
              const localVideos: ApiVideo[] = [];
              source.addEventListener("video", (evt) => {
                const vid = JSON.parse(evt.data) as ApiVideo;
                if (!vid.folder) vid.folder = selectedFolder;
                setUpdatedVideos((videos) => [...videos, vid]);
                localVideos.push(vid);
                videosRef.current = localVideos;
              });

              source.addEventListener("end", (evt) => {
                source.close();
                var updatedIds = videosRef.current.map(x => x.id);
                props.Config.Api.Data.Videos.Setter(vids => vids == undefined ? undefined : [
                  ...vids.filter(v => !updatedIds.includes(v.id)),
                  ...videosRef.current,
                ])
                setStep('end');
              });

              source.onopen = () => {
                console.log('Opening EventSource Connection');
              }
              source.onerror = (evt) => {
                console.error('EventSource error', evt);
              }
            }}
          >
            Fetch files
          </Button>
        </>
      )
        : step == 'scan' ? <div>Scanning the folder: Found <span className="font-mono">{updatedVideos.length.toLocaleString('it-IT')}</span> videos</div>
          : step == 'end' ? <div>Finish scanning: Found {updatedVideos.length} videos</div>
            : <></>
    }
  </GeneralModal>
}

export function PlaylistSelector(props: PlaylistSelectorProps) {
  const selectedVideo = useMemo(() => {
    if (!props.Config.Api.Data.Videos.Getter) return undefined;
    if (!props.Config.Utility.Modals.EditPlaylists.Getter) return undefined;
    return props.Config.Api.Data.Videos.Getter.find(v => v.id == props.Config.Utility.Modals.EditPlaylists.Getter?.id)
  }, [
    props.Config.Api.Data.Videos.Getter,
    props.Config.Utility.Modals.EditPlaylists.Getter,
  ]);
  const [newPlaylist, setNewPlaylist] = useState<string>();
  return <GeneralModal
    Config={props.Config}
    open={selectedVideo != undefined}
    setOpen={() => props.Config.Utility.Modals.EditPlaylists.Setter(undefined)}
    title="Update video playlists"
    description="From this menu you can update the playlist of the selected video"
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    Create a new playlist
    <ButtonGroup className="w-full">
      <Input
        value={newPlaylist ?? ''}
        onChange={(e) => setNewPlaylist(e.target.value)}
      />
      <Button
        size="icon"
        onClick={() => {
          if (!newPlaylist) return;
          props.Config.Api.Instance.PostPlaylistNew(newPlaylist, [selectedVideo!])
            .then(
              (playlist) => {
                props.Config.Api.Data.Playlists.Setter(playlists => playlists === undefined ? [playlist] : [...playlists, playlist]);
                props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                  if (v.id !== selectedVideo!.id) return v;
                  v.playlists?.push(playlist);
                  return v;
                }))
                setNewPlaylist(undefined);
              },
              (error) => props.Config.Errors.Setter(errs => [...errs, error])
            )
        }}
      >
        <Plus />
      </Button>
    </ButtonGroup>

    <Marker variant="separator" className="py-4">
      <MarkerContent>Or</MarkerContent>
    </Marker>

    <Command>
      <CommandInput />
      <CommandList>
        <CommandEmpty>Cannot find playlists</CommandEmpty>
        <CommandGroup heading="Playlists">
          {(props.Config.Api.Data.Playlists.Getter ?? []).map(p => (
            <CommandItem
              key={p.id}
              className=""
              onMouseDown={() => {
                const status = (selectedVideo?.playlists ?? []).map(x => x.id).includes(p.id);
                if (!status) {
                  props.Config.Api.Instance.PatchPlaylistAddVideo(p, selectedVideo!)
                    .then(
                      (video) => {
                        props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                          if (v.id != selectedVideo!.id) return v;
                          console.log('Video updated (Patch)', { ...video });
                          return video;
                        }));
                      },
                      (error) => props.Config.Errors.Setter(errs => [...errs, error])
                    );
                } else {
                  props.Config.Api.Instance.DeletePlaylistAddVideo(p, selectedVideo!)
                    .then(
                      (video) => {
                        props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                          if (v.id != selectedVideo!.id) return v;
                          console.log('Video updated (Delete)', { ...video });
                          return video;
                        }));
                      },
                      (error) => props.Config.Errors.Setter(errs => [...errs, error]),
                    );
                }
              }
              }
            >
              {p.name}
              <CommandShortcut>
                {
                  (selectedVideo?.playlists ?? []).map(x => x.id).includes(p.id)
                    ? <Check />
                    : <X />
                }
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </GeneralModal>
}

export function TagSelector(props: TagSelectorProps) {
  const selectedVideo = useMemo(() => {
    if (!props.Config.Api.Data.Videos.Getter) return undefined;
    if (!props.Config.Utility.Modals.EditTags.Getter) return undefined;
    return props.Config.Api.Data.Videos.Getter.find(v => v.id == props.Config.Utility.Modals.EditTags.Getter?.id)
  }, [
    props.Config.Api.Data.Videos.Getter,
    props.Config.Utility.Modals.EditTags.Getter,
  ]);
  const [newTag, setNewTag] = useState<string>();
  return props.Config.Utility.Modals.EditTags.Getter && <GeneralModal
    Config={props.Config}
    open={selectedVideo != undefined}
    setOpen={() => props.Config.Utility.Modals.EditTags.Setter(undefined)}
    title="Update video tags"
    description="From this menu you can update the tags of the selected video"
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    Create a new tag
    <ButtonGroup className="w-full">
      <Input
        value={newTag ?? ''}
        placeholder="Type new tag name"
        onChange={(e) => setNewTag(e.target.value)}
      />
      <Button
        size="icon"
        onClick={() => {
          if (!newTag) return;
          props.Config.Api.Instance.PostTagNew(newTag, [selectedVideo!])
            .then(
              (tag) => {
                props.Config.Api.Data.Tags.Setter(tags => tags === undefined ? [tag] : [...tags, tag]);
                props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                  if (v.id !== selectedVideo!.id) return v;
                  v.playlists?.push(tag);
                  return v;
                }));
                setNewTag(undefined);
              },
              (error) => props.Config.Errors.Setter(errs => [...errs, error])
            );
        }}
      >
        <Plus />
      </Button>
    </ButtonGroup>

    <Marker variant="separator" className="py-4">
      <MarkerContent>Or</MarkerContent>
    </Marker>

    <Command>
      <CommandInput placeholder="Search a tag" />
      <CommandList>
        <CommandEmpty>Cannot find tags</CommandEmpty>
        <CommandGroup heading="Tags">
          {(props.Config.Api.Data.Tags.Getter ?? []).map(p => (
            <CommandItem
              key={p.id}
              className=""
              onMouseDown={() => {
                const status = (selectedVideo?.tags ?? []).map(x => x.id).includes(p.id);
                if (!status) {
                  props.Config.Api.Instance.PatchTagAddVideo(p, selectedVideo!)
                    .then(
                      (video) => {
                        props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                          if (v.id != selectedVideo!.id) return v;
                          return video;
                        }));
                      },
                      (error) => props.Config.Errors.Setter(errs => [...errs, error]),
                    );
                } else {
                  props.Config.Api.Instance.DeleteTagAddVideo(p, selectedVideo!)
                    .then(
                      (video) => {
                        props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                          if (v.id != selectedVideo!.id) return v;
                          return video;
                        }));
                      },
                      (error) => props.Config.Errors.Setter(errs => [...errs, error]),
                    );
                }
              }}
            >
              {p.name}
              <CommandShortcut>
                {
                  (selectedVideo?.tags ?? []).map(x => x.id).includes(p.id)
                    ? <Check />
                    : <X />
                }
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </GeneralModal>
}

export function ModalSyncData(props: ModalSyncDataProps) {
  const [updateState, setUpdateState] = useState<keyof typeof props.Config.Api.Data>()

  useEffect(() => {
    switch (updateState) {
      case 'Folders':
        props.Config.Api.Instance.GetFolderList()
          .then(
            (data) => {
              props.Config.Api.Data.Folders.Setter(data);
              setUpdateState(undefined);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error])
          );
        return;
      case 'Playlists':
        props.Config.Api.Instance.GetPlaylistList()
          .then(
            (data) => {
              props.Config.Api.Data.Playlists.Setter(data);
              setUpdateState(undefined);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error]));
        return;
      case 'Rules':
        props.Config.Api.Instance.GetRuleList()
          .then(
            (data) => {
              props.Config.Api.Data.Rules.Setter(data);
              setUpdateState(undefined);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error])
          );
        return;
      case 'Tags':
        props.Config.Api.Instance.GetTagList()
          .then(
            (data) => {
              props.Config.Api.Data.Tags.Setter(data);
              setUpdateState(undefined);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error])
          );
        return;
      case 'Videos':
        props.Config.Api.Instance.GetVideoList()
          .then(
            (data) => {
              props.Config.Api.Data.Videos.Setter(data);
              setUpdateState(undefined);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error])
          );
        return;

      case 'SystemLogs':
        props.Config.Api.Instance.GetSystemLogList()
          .then(
            (data) => {
              props.Config.Api.Data.SystemLogs.Setter(data);
              setUpdateState(undefined);
            },
            (error) => props.Config.Errors.Setter(errs => [...errs, error]),
          );
        return;
    }
  }, [updateState]);

  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.SyncDataModal.Getter}
    setOpen={props.Config.Sidebar.Bottom.SyncDataModal.Setter}
    title="Sync local data"
    description="You can sync the data currently on the page"
    cancelBtn={<Button variant="outline">Close</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resource</TableHead>
          <TableHead>Counter</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.keys(props.Config.Api.Data).map((k) => {
          const key = k as keyof typeof props.Config.Api.Data;
          return <TableRow key={key}>
            <TableCell>{key}</TableCell>
            <TableCell>
              {props.Config.Api.Data[key].Getter !== undefined
                ? props.Config.Api.Data[key].Getter.length.toLocaleString('it-IT', { useGrouping: 'always' })
                : '-'
              }
            </TableCell>
            <TableCell>
              {
                updateState === k
                  ? <Button size="icon"><Spinner /></Button>
                  : <Button size="icon" onClick={() => setUpdateState(key)}><CloudBackup /></Button>
              }
            </TableCell>
          </TableRow>
        })}
      </TableBody>
    </Table>
  </GeneralModal>
}

export function ErrorModal(props: ErrorModalProps) {
  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.OpenErrorModal.Getter && props.Config.Errors.Getter.length > 0}
    setOpen={props.Config.Sidebar.Bottom.OpenErrorModal.Setter}
    title="Error handler"
    description={<> Found {props.Config.Errors.Getter.length} error{props.Config.Errors.Getter.length == 1 ? '' : 's'}</>}
    cancelBtn={< Button variant="outline" > Close</Button >}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
    className={props.Config.Settings.ModalKind.Getter == 'dialog' ? 'max-w-200!' : ''}
  >
    <Table className="mb-2">
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Content</TableHead>
          <TableHead>Additional content</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.Config.Errors.Getter.map((e, i) => {
          function isGeneric(x: typeof e): x is GenericError {
            return 'source' in x && 'content' in x
          }
          function isApiError(x: typeof e): x is ApiError {
            return 'errors' in x && 'detail' in x && 'title' in x;
          }
          function isError(x: typeof e): x is Error {
            return x instanceof Error;
          }

          const deleteEvent = <TableCell>
            <Button
              size="icon"
              variant="destructive"
              onClick={() => { props.Config.Errors.Setter(errs => [...errs.filter((_, idx) => idx != i)]) }}
              title="Remove error"
            >
              <X />
            </Button>
          </TableCell>
          if (isError(e)) {
            return <TableRow key={i}>
              {deleteEvent}
              <TableCell>{typeof e.cause == 'string' ? e.cause : e.name}</TableCell>
              <TableCell>{e.message}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          } else if (isApiError(e)) {
            return <TableRow key={i}>
              {deleteEvent}
              <TableCell>{e.title}</TableCell>
              <TableCell>{e.detail}</TableCell>
              <TableCell>
                <ul>
                  {e.errors.map((x, i) => <li key={i}>{x.message}</li>)}
                </ul>
              </TableCell>
            </TableRow>
          } else if (isGeneric(e)) {
            return <TableRow key={i}>
              {deleteEvent}
              <TableCell>{e.source}</TableCell>
              <TableCell>{e.source}</TableCell>
              <TableCell></TableCell>
            </TableRow>
          }
        })}
      </TableBody>
    </Table>
  </GeneralModal >
}