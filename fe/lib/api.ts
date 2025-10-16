import { Configs } from "@/lib/consts";

type HTTPMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
export type Api<T> = {
    results: T[];
    when: string
    error?: string
};


export async function ApiRequest<T>(method: HTTPMethod, endpoint: string, headers: HeadersInit | null, body: string | null): Promise<Api<T>> {
    if (!endpoint.startsWith('/')) endpoint = '/' + endpoint;

    const url = new URL(Configs.ApiEndpoint);
    url.pathname = endpoint;

    return new Promise(async resolve => {
        const result = await fetch(url, {
            method: method,
            headers: headers != null ? headers : undefined,
            body: body != null ? body : undefined,
        });
        const data = await result.json() as Api<T>;
        resolve(data);
    })
}

export type ApiVideo = {
    id: string;
    title: string;
    filePath: string;
    duration: number;
    size: number;
    folder?: {
        id: string;
        path: string;
    }
    attributes: {
        exists: boolean;
        watched: boolean;
    },
    customUrl?: string;
}

export type ApiPicture = {
    id: string;
    filePath: string;
    title: string;
    size: number,
    folder?: {
        id: string;
        path: string;
    }
}

export type ApiPage = {
    id: string;
    title: string;
    url: string;
}