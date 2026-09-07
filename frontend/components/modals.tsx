import { GlobalConfigType } from "@/lib/globals"
import { ComponentProps, Dispatch, ReactNode, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import { ApiFolder, ApiPlaylist, ApiVideo } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Check, Dot, Folders, Plus, RefreshCw, X } from "lucide-react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/utility";
import { ButtonGroup } from "@/components/ui/button-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Combobox, ComboboxChip, ComboboxChips, ComboboxChipsInput, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxValue, useComboboxAnchor } from "@/components/ui/combobox";
import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { CommandShortcut } from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
} & (
    | { kind: 'dialog', side?: string; }
    | { kind: 'sheet', side?: ComponentProps<typeof SheetContent>['side'] }
    | { kind: 'drawer', side?: ComponentProps<typeof Drawer>['direction'] }
  );

type ModalImportFromFileProps = CommonProps & {};
type ModalImportFromUrlProps = CommonProps & {};
type ModalAudioContextProps = CommonProps & {};
type ModalThemeSelectorProps = CommonProps & {};
type ModalKeybindsProps = CommonProps & {};
type ModalSettingsProps = CommonProps & {};
type ModalSyncDataProps = CommonProps & {};
type ModalApplyAutomaticRules = CommonProps & {};
type PlaylistSelectorProps = CommonProps & {};
type TagSelectorProps = CommonProps & {};

export function GeneralModal(props: GeneralModalProps) {
  switch (props.kind) {
    case 'sheet':
      return <Sheet open={props.open} onOpenChange={props.setOpen}>
        <SheetContent side={props.side}>
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
        <DrawerContent>
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
        <DialogContent>
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
    cancelBtn={<Button variant="secondary">Cancel</Button>}
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
    cancelBtn={<Button variant="secondary">Cancel</Button>}
    confirmBtn={<Button type="submit" variant="secondary">Confirm</Button>}
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
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    {!props.Config.VideoPlayer.AudioContext.Enabled.Getter && <Button onClick={() => { setDoEnable(true) }}>Enable</Button>}
    {props.Config.VideoPlayer.AudioContext.Enabled.Getter && <Typography>
      Set the limits of the audio context.
      <ButtonGroup>
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
  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.ThemeModal.Getter}
    setOpen={props.Config.Sidebar.Bottom.ThemeModal.Setter}
    title="Theme selector"
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    Not implemented
  </GeneralModal>
}

export function ModalKeybinds(props: ModalKeybindsProps) {
  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Bottom.KeybindsModal.Getter}
    setOpen={props.Config.Sidebar.Bottom.KeybindsModal.Setter}
    title="Keybinds"
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >
    Not implemented
  </GeneralModal>
}

export function ModalSettings(props: ModalSettingsProps) {
  const LS_Key = "vp-settings"
  const [settingsModalKind, setSettingsModalKind] = useState<typeof props.Config.Settings.ModalKind.Getter>(props.Config.Settings.ModalKind.Getter);
  const [settingsModalSide, setSettingsModalSide] = useState<typeof props.Config.Settings.ModalSide.Getter>(props.Config.Settings.ModalSide.Getter);
  const [settingsVideoPrivacyMode, setSettingsVideoPrivacyMode] = useState<typeof props.Config.Settings.PrivacyVideoMode.Getter>(false);

  const allSettings = useMemo(() => {
    return {
      settingsModalKind,
      settingsModalSide,
      settingsVideoPrivacyMode,
    }
  }, [
    settingsModalKind,
    settingsModalSide,
    settingsVideoPrivacyMode,
  ])

  function reset() {
    const stored = window.localStorage.getItem(LS_Key);
    if (typeof stored == 'string') {
      const settings = JSON.parse(stored) as typeof allSettings;
      setSettingsModalKind(settings.settingsModalKind);
      setSettingsModalSide(settings.settingsModalSide);
      setSettingsVideoPrivacyMode(settings.settingsVideoPrivacyMode);

      props.Config.Settings.ModalKind.Setter(settings.settingsModalKind);
      props.Config.Settings.ModalSide.Setter(settings.settingsModalSide);
      props.Config.Settings.PrivacyVideoMode.Setter(settings.settingsVideoPrivacyMode);
    } else {
      setSettingsModalKind(props.Config.Settings.ModalKind.Getter);
      setSettingsModalSide(props.Config.Settings.ModalSide.Getter);
      setSettingsVideoPrivacyMode(props.Config.Settings.PrivacyVideoMode.Getter);
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
    cancelBtn={<Button variant="secondary" onClick={() => reset()}>Cancel</Button>}
    confirmBtn={<Button onClick={() => submit()}>Confirm</Button>}
    kind={props.Config.Settings.ModalKind.Getter}
    side={props.Config.Settings.ModalSide.Getter}
  >

    <div className="w-full grid grid-cols-2 justify-between gap-y-2">

      <Marker variant="separator" className="pb-2 col-span-2">
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

      <Marker variant="separator" className="pb-2 col-span-2">
        <MarkerContent>Video table</MarkerContent>
      </Marker>

      <Label htmlFor="privacyMode">Privacy mode</Label>
      <span className="w-full flex gap-2">
        <Switch checked={settingsVideoPrivacyMode} onCheckedChange={setSettingsVideoPrivacyMode} />
        {settingsVideoPrivacyMode ? 'On' : 'Off'}
      </span>
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
    cancelBtn={<Button variant="secondary">Cancel</Button>}
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
            .then(props.Config.Api.Data.Rules.Setter);
        }}
      >Refresh rules</Button>
    </div>

    <Button
      className="mt-4 w-full"
      disabled={(props.Config.Api.Data.Rules.Getter?.length ?? 0) == 0 && requestStatus != 'waiting' }
      onClick={() => {
        setRequestStatus('waiting')
        props.Config.Api.Instance.ApplyAutomaticRule()
          .then(updatedVideos => {
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
          });
      }}
    >
      {
        requestStatus != 'waiting'
          ? <>Apply rules</>
          : <><Spinner />Applying rules</>
      }
    </Button>

    {updatedVideos && <>
      <Marker variant="separator" className="py-4">
        <MarkerContent>Results</MarkerContent>
      </Marker>
      <div>Updated {updatedVideos.length} videos</div>
    </>}
  </GeneralModal>
}

export function ModalSyncData(props: ModalSyncDataProps) {
  const [newFolder, setNewFolder] = useState<string>();
  const [step, setStep] = useState<'select' | 'scan' | 'end'>('select');
  const [selectedFolder, setSelectedFolder] = useState<ApiFolder>();
  const [updatedVideos, setUpdatedVideos] = useState<ApiVideo[]>([]);
  const videosRef = useRef<ApiVideo[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>();

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
    setSelectedValue(undefined);
    setUpdatedVideos([]);
    videosRef.current = [];
  }, [step, props.Config.Sidebar.Top.SyncDataModal.Getter])


  return <GeneralModal
    Config={props.Config}
    open={props.Config.Sidebar.Top.SyncDataModal.Getter}
    setOpen={props.Config.Sidebar.Top.SyncDataModal.Setter}
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
                  .then(folder => {
                    if (props.Config.Api.Data.Folders.Getter?.length == 0) { setSelectedValue(folder.id) }
                    props.Config.Api.Data.Folders.Setter(folders => folders === undefined ? [folder] : [...folders, folder]);
                    setNewFolder(undefined);
                  })
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
                  props.Config.Api.Instance.GetFolderList().then(props.Config.Api.Data.Folders.Setter)
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
        : step == 'scan' ? <>Scanning the folder: Found <span className="font-mono">{updatedVideos.length.toLocaleString('it-IT')}</span> videos</>
          : step == 'end' ? <>Finish scanning: Found {updatedVideos.length} videos</>
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
            .then(playlist => {
              props.Config.Api.Data.Playlists.Setter(playlists => playlists === undefined ? [playlist] : [...playlists, playlist]);
              props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                if (v.id !== selectedVideo!.id) return v;
                v.playlists?.push(playlist);
                return v;
              }))
              setNewPlaylist(undefined);
            })
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
                    .then(video => {
                      props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                        if (v.id != selectedVideo!.id) return v;
                        console.log('Video updated (Patch)', { ...video });
                        return video;
                      }));
                    });
                } else {
                  props.Config.Api.Instance.DeletePlaylistAddVideo(p, selectedVideo!)
                    .then(video => {
                      props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                        if (v.id != selectedVideo!.id) return v;
                        console.log('Video updated (Delete)', { ...video });
                        return video;
                      }));
                    });
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
            .then(tag => {
              props.Config.Api.Data.Tags.Setter(tags => tags === undefined ? [tag] : [...tags, tag]);
              props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                if (v.id !== selectedVideo!.id) return v;
                v.playlists?.push(tag);
                return v;
              }));
              setNewTag(undefined);
            })
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
                    .then(video => {
                      props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                        if (v.id != selectedVideo!.id) return v;
                        return video;
                      }));
                    });
                } else {
                  props.Config.Api.Instance.DeleteTagAddVideo(p, selectedVideo!)
                    .then(video => {
                      props.Config.Api.Data.Videos.Setter(videos => videos === undefined ? undefined : videos.map(v => {
                        if (v.id != selectedVideo!.id) return v;
                        return video;
                      }));
                    });
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