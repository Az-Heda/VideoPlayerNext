"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ApiPicture, ApiRequest } from "@/lib/api";
import { Configs } from "@/lib/consts";
import { useEffect, useState } from "react"

export function Gallery () {
    const [images, setImages] = useState<ApiPicture[]>([]);

    useEffect(() => {
        ApiRequest<ApiPicture>('GET', "/api/v1/pictures", null, null).then(data => setImages(data.results))
    }, []);

    return (
        <section className="columns-xs max-lg:columns-3xs">
            {images.map(i => (
                <Dialog key={`gallery-image-${i.id}`}>
                    <DialogTrigger asChild>
                        <img fetchPriority="low" loading="lazy" src={`${Configs.PictureEndpoint}/${i.id}`} />
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>[{i.id}] {i.title}</DialogTitle>
                            <DialogDescription>{i.folder && i.folder.path}</DialogDescription>
                        </DialogHeader>
                        <main>
                            <img fetchPriority="low" loading="lazy" src={`${Configs.PictureEndpoint}/${i.id}`} />
                        </main>
                    </DialogContent>
                </Dialog>
            ))}
        </section>
    )
}