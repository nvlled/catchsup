import { $ } from "php.ts";
import { Layout, _ } from "./components.tsx";

$(
  <Layout>
    <h2>1. Download</h2>
    <div>
      Download the latest release from <_ />
      <a href="https://github.com/nvlled/catchsup/releases">here</a>, and place
      it in a folder where you like. The <b>AppImage</b> file is for linux, and
      the <b>exe</b> file for windows.
    </div>
    <br />
    <h3>Note to windows users</h3>
    <p>
      When you download the file, you will get a dialog popup. You get this
      warning because I didn't sign the application, and signing costs money,
      which I currently don't have. On windows 10, there's a "more info"
      dropdown that let's you proceed with the download anyway.
    </p>
    <h3>Note to linux users</h3>
    <p>
      You have to{" "}
      <code>
        chmod +x <em>catchsup.AppImage</em>
      </code>
      <_ />
      first to be able to run the program.
    </p>
    <hr />
    <h2>2. Setup autorun</h2>
    <p>
      This part is optional, but is important nonetheless. You will need to make
      the program run automatically whenever you boot up your computer, as it
      needs to be constantly running to help you shape habits. Otherwise, you
      will likely completely forget about it on the following days.
    </p>
    <h3>Windows OS setup</h3>
    <p>
      You can follow the instructions from <_ />
      <a href="https://support.lenovo.com/us/en/solutions/ht513728-how-to-run-apps-automatically-at-startup-in-windows-10">
        this site
      </a>
      .
      <details>
        <summary>
          For your convinience, here's the copy-pasted instructions from that
          link
          <br />
          (click to show).
        </summary>
        <h4>Windows 10</h4>
        <ol>
          <li>
            Open the Start menu and look for the app you want to run
            automatically at startup.
          </li>
          <li>
            Right-click the app and then select Open file location. (Note: If
            there isn't an option for Open file location, it means the app
            cannot be set to run automatically at startup.){" "}
          </li>
          <li>Right-click the app to create a shortcut.</li>
          <li>
            Press the Windows logo key + R, then type shell:startup, then select
            OK to open the Startup folder.
          </li>
          <li>
            Copy and paste the shortcut from the file location to the Startup
            folder. Now the app has been set to run automatically at startup.
          </li>
        </ol>
        <h4>Windows 11</h4>
        And here's two options for Window 11.
        <br />
        Option 1:
        <ol>
          <li>1. Open Settings &gt; Apps. Select Startup.</li>
          Startup
          <li>2. Turn the toggle switch on/off to launch apps at startup.</li>
        </ol>
        Option 2:
        <ol>
          <li>
            Open the Start menu and look for the app you want to run
            automatically at startup.
          </li>
          <li>
            Right-click the app and then select Open file location. (Note: If
            there isn't an option for Open file location, it means the app
            cannot be set to run automatically at startup.)
          </li>
          <li>Right-click the app to create a shortcut.</li>
          <li>
            Press the Windows logo key + R, then type shell:startup, then select
            OK to open the Startup folder. shell:startup
          </li>
          <li>
            Copy and paste the shortcut from the file location to the Startup
            folder. Now the app has been set to run automatically at startup.
          </li>
        </ol>
      </details>
    </p>
    <h3>Linux OS setup</h3>
    <p>
      There is no standard way of adding autostart programs in linux. It depends
      on what kind of desktop environment you are using, like Gnome, KDE, or
      XFCE. As you are using linux, I would assume some basic computer
      proficiency and that you know how to search for the instructions.
    </p>
    <p>
      You may want to search for something like <em>KDE autostart</em> or{" "}
      <em>Gnome autostart</em>.
    </p>
    <p>
      Or you could just try appending to <em>.xinitrc</em>
      <_ />
      in case you want to do the DE-agnostic approach.
    </p>
    <hr />
    <h2>3. Next steps</h2>
    <p>
      If haven't already, you can or should try running the program. If it
      doesn't work and it isn't too much to ask,{" "}
      <a href="https://github.com/nvlled/catchsup/issues">
        please let me know.
      </a>
      <br />
      <br />
      But if it works fine, proceed to the <a href="demo.tsx">next page</a> for
      a brief tutorial on how to use it.
    </p>
  </Layout>
);
