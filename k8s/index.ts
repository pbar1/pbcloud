import * as cloudflare from "./namespaces/cloudflare";
import * as media from "./namespaces/media";
import * as monitoring from "./namespaces/monitoring";
import * as onepassword from "./namespaces/onepassword";

onepassword.build();
media.build();
monitoring.build();
cloudflare.build();
