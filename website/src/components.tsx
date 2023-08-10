import { $ } from "php.ts";
export { createStyle } from "css.tsx";

function MainNav() {
  return (
    <nav className="main">
      <ul>
        <li>
          {" "}
          <a href="index.tsx">home</a>{" "}
        </li>
        <li>
          {" "}
          <a href="demo.tsx">demo</a>{" "}
        </li>
        <li>
          {" "}
          <a href="install.tsx">install</a>{" "}
        </li>
      </ul>
    </nav>
  );
}

export function Layout({
  head,
  children,
  style,
}: {
  head?: JSX.Children;
  style?: string;
  children: JSX.Children;
}) {
  return (
    <html>
      <head>
        <meta charSet="utf8" />
        <title>Catchsup</title>
        <link rel="stylesheet" href="/style.css" />
        {head}
        {style && <style>{style}</style>}
      </head>
      <body>
        <div className="wrapper bg-red-dark p6">
          <div className="bg-dark flex align-between">
            <a className="site-logo flex" href="/">
              <img src="/images/logo.png" style={{ width: "80px" }} />
              <h1 className="fg-light">catchsup</h1>
            </a>
            <MainNav />
          </div>
          <br />
          {children}
        </div>
      </body>
    </html>
  );
}

export function _() {
  return <> </>;
}
