// deno-fmt-ignore-file
// biome-ignore format: generated types do not need formatting
// prettier-ignore
import type { PathsForPages, GetConfigResponse } from 'waku/router';

// prettier-ignore
import type { getConfig as File_CreateAndSign_getConfig } from './pages/create-and-sign';
// prettier-ignore
import type { getConfig as File_Devis_getConfig } from './pages/devis';
// prettier-ignore
import type { getConfig as File_Index_getConfig } from './pages/index';
// prettier-ignore
import type { getConfig as File_MassUpload_getConfig } from './pages/mass-upload';
// prettier-ignore
import type { getConfig as File_Standalone_getConfig } from './pages/standalone';

// prettier-ignore
type Page =
| ({ path: '/create-and-sign' } & GetConfigResponse<typeof File_CreateAndSign_getConfig>)
| ({ path: '/devis' } & GetConfigResponse<typeof File_Devis_getConfig>)
| ({ path: '/' } & GetConfigResponse<typeof File_Index_getConfig>)
| ({ path: '/mass-upload' } & GetConfigResponse<typeof File_MassUpload_getConfig>)
| ({ path: '/standalone' } & GetConfigResponse<typeof File_Standalone_getConfig>);

// prettier-ignore
declare module 'waku/router' {
  interface RouteConfig {
    paths: PathsForPages<Page>;
  }
  interface CreatePagesConfig {
    pages: Page;
  }
}
