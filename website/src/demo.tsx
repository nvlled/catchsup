import { Layout, _ } from "./components.tsx";
import { $ } from "php.ts";

$(
  <Layout>
    <h2>Video demo</h2>
    <video src="demo.mkv" controls style={{ width: "100%" }} />
    <p>
      This is janky video I've made a with robotic text-to-speech voices,
      console terminals, and OBS.
    </p>
    <p>
      Not that it matters, but the background is from the anime Vinland Saga.
    </p>
  </Layout>
);
