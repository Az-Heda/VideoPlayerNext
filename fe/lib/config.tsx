import { Drawer } from "@/components/ui/drawer";
import { SheetContent } from "@/components/ui/sheet";
import { Sun, Moon, Palette, MonitorCog, CirclePlus, TableOfContents, Pencil, Trash, LayoutGrid, Table, Eye, EyeOff, Cog, ArrowBigUp, ExternalLink, PackageX, Keyboard, RotateCcw, Trash2, Sidebar } from "lucide-react";
import { ApiRequest } from "@/lib/api";
import { Configs } from "@/lib/consts";
import { KeysInLocalStorage } from "@/lib/commands";

export type GetProps<T extends any[]> = T extends [...infer _, infer L] ? L : never;

export const Config = {
  Defaults: {
    ViewMode: 'grid' as 'grid' | 'table',
    PasswordMaxLength: 40,
    TagFilter: {
      All: '--all',
      None: '--none',
    },
    KeyboardShortcuts: {
      // ServiceNew: { Id: 'service-new', Key: 'N', Alt: true },
      // ServiceList: { Id: 'service-list', Key: 'L', Alt: true },
      // ServiceVisualization: { Id: 'service-visualization', Key: 'V', Alt: true },
      // ThemeSelector: { Id: 'theme-selector', Key: 'P', Alt: true },
      // ForceTheme: { Id: 'theme-force', Key: 'F', Alt: true },
      // Settings: { Id: 'settings', Key: 'F1' },
      // KeyboardShortcuts: { Id: 'keyboard-shortcuts', Key: 'K', Alt: true },
      // ScalarOpenapi: { Id: 'scalar-openapi', Key: 'O', Alt: true },
      ThemeSelector: { Id: 'theme-selector', Key: 'T', Alt: true, Shift: true },
      EnableAudioContext: { Id: 'enable-audio-context', Key: 'A', Alt: true, Shift: true },
      Settings: { Id: 'settings', Key: 'F1' },
      KeyboardShortcuts: { Id: 'keyboard-shortcuts', Key: 'K', Alt: true },
      ScalarOpenapi: { Id: 'dev-scalar-openapi', Key: 'O', Alt: true, Shift: true, Ctrl: true },
      TriggerSidebar: { Id: 'trigger-sidebar', Key: 'H', Alt: true, Shift: true },
    } as {
      EnableAudioContext: KeysInLocalStorage,
      ThemeSelector: KeysInLocalStorage,
      KeyboardShortcuts: KeysInLocalStorage,
      ScalarOpenapi: KeysInLocalStorage,
      Settings: KeysInLocalStorage,
      TriggerSidebar: KeysInLocalStorage
    },
    ThemeSelector: {
      Kind: 'sheet',
      Side: 'right',
    } as _themeSelector,
    Website: {
      title: "PSW - Manager",
      description: "Password Manager",
    },
    CommandsSections: {
      Services: ['service-new', 'service-list', 'service-visualization'],
      Preferences: ['theme-selector', 'keyboard-shortcuts', 'theme-force'],
      Settings: ['settings'],
    } as { [key: string]: string[] },
    Override: {
      ForceThemeLightClassName: 'force-light',
      ForceThemeDarkClassName: 'force-dark',
    }
  },
  LocalStorageKeys: {
    PasswordMaxLength: 'password-max-length',
    KeyBinds: 'custom-key-binds',
    ForceTheme: 'theme-forced',
  },
  Themes: {
    Default: ['default'],
    ShadcnStudio: ['material-design', 'slack', 'spotify', 'vs-code', 'caffeine'],
    TweakCn: ['amethyst-haze', 'darkmatter', 'vercel', 'violet-bloom'],
    ZippyStarter: ['starbucks'],
  } as { [key: string]: string[] },
  Charset: {
    Letters: 'abcdefghijklmnopqrstuvwxyz',
    Numbers: '0123456789',
    Symbols: `!$&/()[]{},.;:-_|"£%=?\'@*§<>`,
  },
  KeyboardTextFor: {
    KeyCtrl: 'CTRL',
    KeyAlt: 'ALT',
    KeyShift: 'SHIFT',
    KeyMeta: 'META',
  },
  Icons: {
    Sidebar: <Sidebar/>,
    ThemeLight: <Sun />,
    ThemeDark: <Moon />,
    ThemeSelector: <Palette />,
    ThemeSystem: <MonitorCog />,
    ServiceNew: <CirclePlus />,
    ServiceList: <TableOfContents />,
    ServiceEdit: <Pencil size={18} />,
    ServiceDelete: <Trash size={18} />,
    ServiceGrid: <LayoutGrid />,
    ServiceTable: <Table />,
    ShowPassword: <Eye />,
    HidePassword: <EyeOff />,
    Settings: <Cog />,
    KeyShift: <ArrowBigUp />,
    ScalarOpenApi: <ExternalLink />,
    Empty: <PackageX />,
    KeyBinds: <Keyboard />,
    KeyBindsEdit: <Pencil />,
    KeyBindsReset: <RotateCcw />,
    KeyBindsDelete: <Trash2 />
  },

  StaticText: {
    ThemeSelector: {
      Title: 'Themes',
      Description: 'Change current theme',
      Buttons: {
        Save: 'Save theme',
        Cancel: 'Cancel'
      },
      Descript: {
        Background: 'Background',
        Primary: 'Primary',
        Secondary: 'Secondary',
        Accent: 'Accent',
        Destructive: 'Destructive',
      }
    },
    KeyboardShortcuts: {
      NewShortcutLabel: 'Type your keyboard shortcut',
      Descript: {
        Edit: 'Edit',
        Reset: 'Reset',
        Delete: 'Delete'
      },
    },
    Service: {
      Grid: {
        NoData: 'Cannot find services',
      },
      DeleteConfirm: {
        Title: "Are your sure you want to delete this service?",
        Description: "Once the service is deleted there is no way to get back the secret key",
        Buttons: {
          Confirm: 'Yes',
          Cancel: 'No',
        }
      },
    },
  },

  Api: {
    Handler: new ApiRequest(Configs.ApiEndpoint)
  }
} as const;





type _themeSelector = {
  StaticText: {
    Title: string;
    Description: string;
    Btn: {
      Save: string;
      Cancel: string;
    }
  }
} & (
    {
      Kind: 'sheet'
      Side: GetProps<Parameters<typeof SheetContent>>['side']
    } | {
      Kind: 'drawer'
      Direction: GetProps<Parameters<typeof Drawer>>['direction']
    }
  )