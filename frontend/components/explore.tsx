import { GlobalConfigType } from "@/lib/globals";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { MainvideoTable } from "./table-video";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Film, Hash, X } from "lucide-react";
import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription, AttachmentActions, AttachmentAction } from "@/components/ui/attachment";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { SortArrayObject } from "@/lib/utils";

type CommonProps = {
  config: GlobalConfigType;
}
type TabType = 'video' | 'playlist' | 'tag'
type TabSetter = {
  TabSetter: Dispatch<SetStateAction<TabType>>
}

type ExplorePlaylistsProps = CommonProps & TabSetter & {};
type ExploreTagsProps = CommonProps & TabSetter & {};
type ExploreVideosProps = CommonProps & TabSetter & {};

export function Explore(props: CommonProps) {
  const [tabValue, setTabValue] = useState<TabType>('video');
  const fetchedPlaylists = useMemo(() => props.config.Api.Data.Playlists.Getter != undefined, [props.config.Api.Data.Playlists.Getter])
  const fetchedTags = useMemo(() => props.config.Api.Data.Tags.Getter != undefined, [props.config.Api.Data.Tags.Getter])
  const fetchedVideos = useMemo(() => props.config.Api.Data.Videos.Getter != undefined, [props.config.Api.Data.Videos.Getter])

  return (fetchedVideos || fetchedPlaylists || fetchedTags)
    ? <> <Tabs value={tabValue} onValueChange={(data) => setTabValue(data as TabType)}>
      <TabsList variant="line">
        {fetchedVideos && <TabsTrigger value="video">Videos</TabsTrigger>}
        {fetchedPlaylists && <TabsTrigger value="playlist">Playlists</TabsTrigger>}
        {fetchedTags && <TabsTrigger value="tags">Tags</TabsTrigger>}
      </TabsList>
      {fetchedVideos && <TabsContent value="video">
        <ExploreVideos {...props} TabSetter={setTabValue} />
      </TabsContent>}
      {fetchedPlaylists && <TabsContent value="playlist">
        <ExplorePlaylists {...props} TabSetter={setTabValue} />
      </TabsContent>}
      {fetchedTags && <TabsContent value="tags">
        <ExploreTags {...props} TabSetter={setTabValue} />
      </TabsContent>}
    </Tabs>
    </>
    : <Empty className="w-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Spinner />
        </EmptyMedia>
        <EmptyTitle>Loading data in progress</EmptyTitle>
        <EmptyDescription>
          We're loading the informations about videos, playlists and tags, please wait
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
}

export function ExplorePlaylists(props: ExplorePlaylistsProps) {
  const [input, setInput] = useState<string>();
  const playlists = useMemo(() => {
    if (props.config.Api.Data.Playlists.Getter == undefined) return [];
    return props.config.Api.Data.Playlists.Getter.filter(t => {
      const conds: boolean[] = [];

      if (input != undefined && input != "") conds.push(t.name.toLowerCase().includes(input.toLowerCase()));

      return conds.length == 0 || conds.every(Boolean);
    });
  }, [props.config.Api.Data.Playlists.Getter, input])
  return playlists && <ScrollArea>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      <Label className="col-span-2">
        <span className="whitespace-nowrap">Filter playlist</span>
        <Input value={input ?? ''} onChange={(e) => setInput(e.target.value)} />
      </Label>
      {SortArrayObject(playlists, p => p.name).map(p => (
        <Attachment key={p.id} className="w-full">
          <AttachmentMedia>
            <Film />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle className="overflow-x-clip text-ellipsis">{p.name}</AttachmentTitle>
            <AttachmentDescription>{props.config.Api.Data.Videos.Getter?.filter(x => x.playlists?.map(x => x.id).includes(p.id)).length} videos</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction asChild className="size-auto">
              <Button
                onClick={() => {
                  props.config.Filters.Playlist.Setter(p)
                  props.TabSetter('video')
                }}
              >
                Filter
              </Button>
            </AttachmentAction>
          </AttachmentActions>

        </Attachment>
      ))}
    </div>
  </ScrollArea>
}

export function ExploreTags(props: ExploreTagsProps) {
  const [input, setInput] = useState<string>();
  const tags = useMemo(() => {
    if (props.config.Api.Data.Tags.Getter == undefined) return [];
    return props.config.Api.Data.Tags.Getter.filter(t => {
      const conds: boolean[] = [];

      if (input != undefined && input != "") conds.push(t.name.toLowerCase().includes(input.toLowerCase()));

      return conds.length == 0 || conds.every(Boolean);
    });
  }, [props.config.Api.Data.Tags.Getter, input])
  return tags && <ScrollArea>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
      <Label className="col-span-2">
        <span className="whitespace-nowrap">Filter tags</span>
        <Input value={input ?? ''} onChange={(e) => setInput(e.target.value)} />
      </Label>
      {SortArrayObject(tags, t => t.name).map(p => (
        <Attachment key={p.id} className="w-full">
          <AttachmentMedia>
            <Hash />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle className="overflow-x-clip text-ellipsis">{p.name}</AttachmentTitle>
            <AttachmentDescription>{props.config.Api.Data.Videos.Getter?.filter(x => x.tags?.map(x => x.id).includes(p.id)).length} videos</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction asChild className="size-auto">
              <Button
                onClick={() => {
                  props.config.Filters.Tag.Setter(p)
                  props.TabSetter('video')
                }}
              >
                Filter
              </Button>
            </AttachmentAction>
          </AttachmentActions>

        </Attachment>
      ))}
    </div>
  </ScrollArea>
}

export function ExploreVideos(props: ExploreVideosProps) {
  return <MainvideoTable Config={props.config} />
}