import { $ } from "php.ts";
import { _, createStyle, Layout } from "./components.tsx";

const images: string[] = [];
for await (const f of Deno.readDir("src/images/screenshots")) {
  images.push(f.name);
}
images.sort();

$(
  <Layout>
    <h2>What is this?</h2>
    <p>
      Catchsup is an <em>experimental</em> tool to help you to learn a new habit
      or skill. It conceptually similar to pomodoro in that it helps you get
      started, but it also helps to do it consistently, until it becomes a
      habit.
    </p>
    <h3>Features</h3>
    <ul>
      <li>Simple, basic UI</li>
      <li>Fully offline</li>
      <li>Exportable/importable data</li>
    </ul>
    <Screenshot />
    <h2>How is this done?</h2>
    <p>
      By means of reminders. These reminders are done periodically throughout
      the day, day after day. The reminders are designed to become gradually
      obstrusive over time. The way the reminders are shown seems random, but
      they done in an intentional way to prime up the user to action. At least,
      that's what I'm aiming to.
    </p>
    <p>
      In your free procrastination time, you could ignore a reminder once or
      twice. But as time goes on, it gets more intrusive until you have no
      choice but to do something about it.
    </p>
    <h2>What if there other things to do?</h2>
    <p>
      If you have actual work, and don't want to be disturbed, you can set a "no
      disturb" option for however long you like.
    </p>
    <h2>Does this even work?</h2>
    <p>
      Good question! Of course it does!!11! Please BUY NOW to change your life
      and become a functional human being you have always dreamed of, for only
      $1.99.
    </p>
    <p>Just kidding.</p>
    <p>
      There's no guarantee that this works for other people, it's very much a
      experimental WIP.
    </p>
    <p>
      I'm in the process of testing it myself, I still make a lot tiny tweaks to
      improve it. But after month of testing, I can say with certainty that it
      works for me.
    </p>
    <p>
      I've been almost consistently doing meditations in early noon. And I
      managed to slowly read through a introductory book related to philosophy
      of science. This is a considerable improvement for me, speaking as someone
      who has difficulty maintaining attention or interest on anything, much
      less for a relatively dull book.
    </p>
    <p>
      Without catchsup, I would have attempted to fly through the book with a
      terrible comprehesion rate, and I would have most likely given up 2 days
      and 30 pages later. With catchsup, I managed to slowly and deliberately
      read through a book, and even have time to reflect in between readings.
    </p>
    <h2>Okay, but does it really work?</h2>
    <p>
      I don't know, maybe you can help me find out. Catchsup is currently
      available for testing. Ideally, I could earn some money from this, but it
      remains to be seen if this is even a viable product.
    </p>
    <p>
      You can view this <a href="demo.tsx">demo</a> to see on how I use it.
    </p>
    <p>
      If you are curious and want to try it out, you can proceed to the <_ />
      <a href="install.tsx">download and setup page</a>.
    </p>
  </Layout>
);

const css = createStyle({ scoped: true });

function Screenshot() {
  let imageIndex = parseInt($.request.data.i ?? 0, 10);
  if (isNaN(imageIndex)) imageIndex = 0;
  if (!images[imageIndex]) return null;

  return (
    <div id={css.id} className="images">
      <div id="image-top" />
      <a
        href={`index.tsx?i=${
          !imageIndex || imageIndex < 0 ? images.length - 1 : imageIndex - 1
        }#image-top`}
      >
        ←
      </a>
      <img src={"images/screenshots/" + images[imageIndex]} />
      <a
        href={`index.tsx?i=${
          imageIndex >= images.length - 1 ? 0 : imageIndex + 1
        }#image-top`}
      >
        →
      </a>
      {css`
        $base {
          display: flex;
          align-items: stretch;
        }
        $base a {
          display: block;
          width: 100%;
          display: flex;
          align-items: center;
          text-decoration: none;
          font-size: 200%;
        }
        $base a:first-child {
          justify-content: end;
        }
      `}
    </div>
  );
}
