const host = "http://vp.localhost"

export const Configs = {
    SiteName: "[NX] Video Player",
    EnableGoogleLogin: false,
    ApiEndpoint: host,
    PictureEndpoint: `${host}/picture`,
    PriorityFolder: '_auto-delete',
    ProdEnv: true,
    VolumeLimits: [ 100, 200, 300, 400, 500, 600 ],
    VolumeLimitsDefaultIdx: 2,
} as const;