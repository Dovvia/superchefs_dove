"use strict";
(() => {
  var I = () => {
    let e = () => {
      let t = document.location.href,
        o = document.querySelector("body"),
        i = new MutationObserver(() => {
          t !== document.location.href &&
            ((t = document.location.href),
            window.top &&
              (window.top.postMessage(
                { type: "URL_CHANGED", url: document.location.href },
                "https://superchefs-dove.vercel.app"
              ),
              window.top.postMessage(
                { type: "URL_CHANGED", url: document.location.href },
                "http://localhost:3000"
              )));
        });
      o && i.observe(o, { childList: !0, subtree: !0 });
    };
    window.addEventListener("load", e);
  };

  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
    .then(() => console.log('Service worker registered'))
    .catch((error) => console.log('Error registering service worker:', error));
  }
  
  var a = {
      HIGHLIGHT_COLOR: "#0da2e7",
      HIGHLIGHT_BG: "#0da2e71a",
      ALLOWED_ORIGINS: [
        "http://localhost:3000",
        
      ],
      DEBOUNCE_DELAY: 10,
      Z_INDEX: 1e4,
      TOOLTIP_OFFSET: 25,
      MAX_TOOLTIP_WIDTH: 200,
      SCROLL_DEBOUNCE: 420,
      FULL_WIDTH_TOOLTIP_OFFSET: "12px",
      HIGHLIGHT_STYLE: {
        FULL_WIDTH: { OFFSET: "-5px", STYLE: "solid" },
        NORMAL: { OFFSET: "0", STYLE: "solid" },
      },
      SELECTED_ATTR: "data-lov-selected",
      HOVERED_ATTR: "data-lov-hovered",
      OVERRIDE_STYLESHEET_ID: "local-override",
    },
    y = (e) => {
      a.ALLOWED_ORIGINS.forEach((t) => {
        try {
          if (!window.parent) return;
          if (!e || typeof e != "object") {
            console.error("Invalid message format");
            return;
          }
          window.parent.postMessage(e, t);
        } catch (o) {
          console.error(`Failed to send message to ${t}:`, o);
        }
      });
    };
  var W = (e) => {
      let t = window.fetch;
      window.fetch = async function (...o) {
        try {
          let i = await t(...o);
          if (!i.ok) {
            let s = i.clone(),
              h = s?.text ? await s.text() : void 0;
            e("non_200_response", {
              ...i,
              status: i.status,
              url: o?.[0] || i.url,
              body: h,
              method: o?.[1]?.method || "GET",
              origin: window.location.origin,
            });
          }
          return i;
        } catch (i) {
          if (i instanceof TypeError)
            e("fetch_error", {
              message: i?.message,
              stack: i?.stack,
              url: o?.[0],
              method: o?.[1]?.method || "GET",
              origin: window.location.origin,
            });
          else {
            let s = {
              url: o?.[0],
              method: o?.[1]?.method || "GET",
              origin: window.location.origin,
              message: "Unknown fetch error",
              stack: "Not available",
            };
            typeof i == "object" &&
              i !== null &&
              "message" in i &&
              typeof i.message == "string" &&
              (s.message = i.message),
              typeof i == "object" &&
                i !== null &&
                "stack" in i &&
                typeof i.stack == "string" &&
                (s.stack = i.stack),
              e("fetch_error", s);
          }
          throw i;
        }
      };
    },
    $ = (() => {
      let e = !1,
        t = ({ message: o, lineno: i, colno: s, filename: h, error: u }) => ({
          message: o,
          lineno: i,
          colno: s,
          filename: h,
          stack: u?.stack,
        });
      return () => {
        if (e) return;
        let o = new Set(),
          i = (l) => {
            let { lineno: r, colno: d, filename: T, message: _ } = l;
            return `${_}|${T}|${r}|${d}`;
          };
        W(async (l, r) => {
          l === "non_200_response"
            ? y({
                type: "FETCH_ERROR",
                error: {
                  message: `failed to call url ${r.url} with status ${r.status} and statusText ${r.statusText}`,
                  status: r.status,
                  statusText: r.statusText,
                  url: r.url,
                  body: r.body,
                },
              })
            : l === "fetch_error" && y({ type: "FETCH_ERROR", error: r });
        });
        let h = (l) =>
            o.has(l) ? !0 : (o.add(l), setTimeout(() => o.delete(l), 5e3), !1),
          u = (l) => {
            let r = i(l);
            if (h(r)) return;
            let d = t(l);
            y({ type: "RUNTIME_ERROR", error: d });
          };
        window.addEventListener("error", u),
          window.addEventListener("unhandledrejection", (l) => {
            if (!l.reason?.stack) return;
            let r = l.reason?.stack || l.reason?.message || String(l.reason);
            if (h(r)) return;
            let d = {
              message: l.reason?.message || "Unhandled promise rejection",
              stack: l.reason?.stack || String(l.reason),
            };
            y({ type: "UNHANDLED_PROMISE_REJECTION", error: d });
          }),
          (e = !0);
      };
    })();
  var N = class {
      constructor(t) {
        this.message = `[Circular Reference to ${t}]`;
      }
    },
    f = class {
      constructor(t, o) {
        (this._type = t), (this.value = o);
      }
    },
    B = {
      maxDepth: 10,
      indent: 2,
      includeSymbols: !0,
      preserveTypes: !0,
      maxStringLength: 1e4,
      maxArrayLength: 100,
      maxObjectKeys: 100,
    };
  function S(e, t = {}, o = new WeakMap(), i = "root") {
    let s = { ...B, ...t };
    if (i.split(".").length > s.maxDepth)
      return new f("MaxDepthReached", `[Max depth of ${s.maxDepth} reached]`);
    if (e === void 0) return new f("undefined", "undefined");
    if (e === null) return null;
    if (typeof e == "string")
      return e.length > s.maxStringLength
        ? new f(
            "String",
            `${e.slice(0, s.maxStringLength)}... [${
              e.length - s.maxStringLength
            } more characters]`
          )
        : e;
    if (typeof e == "number")
      return Number.isNaN(e)
        ? new f("Number", "NaN")
        : Number.isFinite(e)
        ? e
        : new f("Number", e > 0 ? "Infinity" : "-Infinity");
    if (typeof e == "boolean") return e;
    if (typeof e == "bigint") return new f("BigInt", e.toString());
    if (typeof e == "symbol") return new f("Symbol", e.toString());
    if (typeof e == "function")
      return new f("Function", {
        name: e.name || "anonymous",
        stringValue: e.toString().slice(0, s.maxStringLength),
      });
    if (e && typeof e == "object") {
      if (o.has(e)) return new N(o.get(e));
      o.set(e, i);
    }
    if (e instanceof Error) {
      let r = { name: e.name, message: e.message, stack: e.stack };
      for (let d of Object.getOwnPropertyNames(e))
        r[d] || (r[d] = S(e[d], s, o, `${i}.${d}`));
      return new f("Error", r);
    }
    if (e instanceof Date)
      return new f("Date", {
        iso: e.toISOString(),
        value: e.valueOf(),
        local: e.toString(),
      });
    if (e instanceof RegExp)
      return new f("RegExp", {
        source: e.source,
        flags: e.flags,
        string: e.toString(),
      });
    if (e instanceof Promise) return new f("Promise", "[Promise]");
    if (e instanceof WeakMap || e instanceof WeakSet)
      return new f(e.constructor.name, "[" + e.constructor.name + "]");
    if (e instanceof Set) {
      let r = Array.from(e);
      return r.length > s.maxArrayLength
        ? new f("Set", {
            values: r
              .slice(0, s.maxArrayLength)
              .map((d, T) => S(d, s, o, `${i}.Set[${T}]`)),
            truncated: r.length - s.maxArrayLength,
          })
        : new f("Set", {
            values: r.map((d, T) => S(d, s, o, `${i}.Set[${T}]`)),
          });
    }
    if (e instanceof Map) {
      let r = {},
        d = 0,
        T = 0;
      for (let [_, O] of e.entries()) {
        if (T >= s.maxObjectKeys) {
          d++;
          continue;
        }
        let A =
          typeof _ == "object"
            ? JSON.stringify(S(_, s, o, `${i}.MapKey`))
            : String(_);
        (r[A] = S(O, s, o, `${i}.Map[${A}]`)), T++;
      }
      return new f("Map", { entries: r, truncated: d || void 0 });
    }
    if (ArrayBuffer.isView(e)) {
      let r = e;
      return new f(e.constructor.name, {
        length: r.length,
        byteLength: r.byteLength,
        sample: Array.from(r.slice(0, 10)),
      });
    }
    if (Array.isArray(e))
      return e.length > s.maxArrayLength
        ? e
            .slice(0, s.maxArrayLength)
            .map((r, d) => S(r, s, o, `${i}[${d}]`))
            .concat([`... ${e.length - s.maxArrayLength} more items`])
        : e.map((r, d) => S(r, s, o, `${i}[${d}]`));
    let h = {},
      u = [...Object.getOwnPropertyNames(e)];
    s.includeSymbols &&
      u.push(...Object.getOwnPropertySymbols(e).map((r) => r.toString()));
    let l = 0;
    return (
      u.slice(0, s.maxObjectKeys).forEach((r) => {
        try {
          let d = e[r];
          h[r] = S(d, s, o, `${i}.${r}`);
        } catch (d) {
          h[r] = new f("Error", `[Unable to serialize: ${d.message}]`);
        }
      }),
      u.length > s.maxObjectKeys &&
        ((l = u.length - s.maxObjectKeys), (h["..."] = `${l} more properties`)),
      h
    );
  }
  var Y = { log: console.log, warn: console.warn, error: console.error },
    q = { log: "info", warn: "warning", error: "error" },
    v = (() => {
      let e = !1;
      return () => {
        if (e) return;
        let t = (o) => {
          console[o] = (...i) => {
            Y[o].apply(console, i);
            let s = null;
            if (o === "warn" || o === "error") {
              let u = new Error();
              u.stack &&
                (s = u.stack
                  .split(
                    `
`
                  )
                  .slice(2).join(`
`));
            }
            let h = i.map((u) =>
              S(u, { maxDepth: 5, includeSymbols: !0, preserveTypes: !0 })
            );
            y({
              type: "CONSOLE_OUTPUT",
              level: q[o],
              message:
                h
                  .map((u) =>
                    typeof u == "string" ? u : JSON.stringify(u, null, 2)
                  )
                  .join(" ") +
                (s
                  ? `
` + s
                  : ""),
              logged_at: new Date().toISOString(),
              raw: h,
            });
          };
        };
        t("log"), t("warn"), t("error"), (e = !0);
      };
    })();
  var H = () => {
    let e = new Set();
    window.addEventListener(
      "keydown",
      (t) => {
        let o = [];
        t.metaKey && o.push("Meta"),
          t.ctrlKey && o.push("Ctrl"),
          t.altKey && o.push("Alt"),
          t.shiftKey && o.push("Shift");
        let i =
            t.key !== "Meta" &&
            t.key !== "Control" &&
            t.key !== "Alt" &&
            t.key !== "Shift"
              ? t.key
              : "",
          s = [...o, i].filter(Boolean).join("+");
        ["Meta+z", "Meta+Backspace", "Meta+d"].includes(s) &&
          t.preventDefault(),
          s &&
            y({
              type: "KEYBIND",
              payload: {
                compositeKey: s,
                rawEvent: {
                  key: t.key,
                  code: t.code,
                  metaKey: t.metaKey,
                  ctrlKey: t.ctrlKey,
                  altKey: t.altKey,
                  shiftKey: t.shiftKey,
                },
                timestamp: Date.now(),
              },
            });
      },
      { passive: !0 }
    );
  };
  window.LOV_SELECTOR_SCRIPT_VERSION = "1.0.1";
  var R = (e) =>
      e.hasAttribute("data-component-path") &&
      e.hasAttribute("data-component-file") &&
      e.hasAttribute("data-component-line"),
    k = (e) => {
      let t = e.getAttribute("data-component-path") || null,
        o = e.getAttribute("data-component-file") || null,
        i = e.tagName.toLowerCase(),
        s = parseInt(e.getAttribute("data-component-line") || "0", 10),
        h = e.getAttribute("data-component-content") || null,
        u = Array.from(e.children)
          .filter((l) => R(l) && l.getAttribute("data-component-path") !== t)
          .filter(
            (l, r, d) =>
              r ===
              d.findIndex(
                (T) =>
                  T.getAttribute("data-component-path") ===
                  l.getAttribute("data-component-path")
              )
          )
          .map((l) => ({
            filePath: l.getAttribute("data-component-path") || "",
            fileName: l.getAttribute("data-component-file") || "",
            elementType: l.tagName.toLowerCase(),
            lineNumber: parseInt(
              l.getAttribute("data-component-line") || "0",
              10
            ),
            content: l.getAttribute("data-component-content") || "",
            className: l.getAttribute("class") || "",
            textContent: l.innerText,
            attrs: { src: l.getAttribute("src") || "" },
          }));
      return {
        filePath: t || "",
        fileName: o || "",
        elementType: i,
        lineNumber: s,
        content: h || "",
        children: u,
        className: e.getAttribute("class") || "",
        textContent: e.innerText,
        attrs: { src: e.getAttribute("src") || "" },
      };
    },
    M = () => {
      class e {
        constructor() {
          (this.hoveredElement = null),
            (this.isActive = !1),
            (this.tooltip = null),
            (this.scrollTimeout = null),
            (this.mouseX = 0),
            (this.mouseY = 0),
            (this.styleElement = null);
        }
        reset() {
          (this.hoveredElement = null), (this.scrollTimeout = null);
        }
      }
      let t = new e(),
        o = (n, E) => {
          let g = null;
          return (...c) => {
            g && clearTimeout(g), (g = setTimeout(() => n(...c), E));
          };
        };
      H();
      let i = () => {
          (t.tooltip = document.createElement("div")),
            (t.tooltip.className = "gpt-selector-tooltip"),
            t.tooltip.setAttribute("role", "tooltip"),
            document.body.appendChild(t.tooltip);
          let n = document.createElement("style");
          (n.textContent = `
        .gpt-selector-tooltip {
          position: fixed;
          z-index: ${a.Z_INDEX};
          pointer-events: none;
          background-color: ${a.HIGHLIGHT_COLOR};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: bold;
          line-height: 1;
          white-space: nowrap;
          display: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: opacity 0.2s ease-in-out;
          margin: 0;
        }
        [${a.HOVERED_ATTR}] {
          position: relative;
        }
        [${a.HOVERED_ATTR}]::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0px;
          outline: 1px dashed ${a.HIGHLIGHT_COLOR} !important;
          outline-offset: ${a.HIGHLIGHT_STYLE.NORMAL.OFFSET} !important;
          background-color: ${a.HIGHLIGHT_BG} !important;
          z-index: ${a.Z_INDEX};
          pointer-events: none;
        }

        [${a.SELECTED_ATTR}] {
          position: relative;
        }
        [${a.SELECTED_ATTR}]::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0px;
          outline: 1px dashed ${a.HIGHLIGHT_COLOR} !important;
          outline-offset: 3px !important;
          transition: outline-offset 0.2s ease-in-out;
          z-index: ${a.Z_INDEX};
          pointer-events: none;
        }

        [${a.SELECTED_ATTR}][contenteditable] {
          outline: none !important;
        }

        [${a.HOVERED_ATTR}][data-full-width]::before,
        [${a.SELECTED_ATTR}][data-full-width]::before {
          outline-offset: ${a.HIGHLIGHT_STYLE.FULL_WIDTH.OFFSET} !important;
        }
      `),
            document.head.appendChild(n);
        },
        s = (n) => {
          if (!(!t.tooltip || !n))
            try {
              let E = n.getBoundingClientRect(),
                g = n.tagName.toLowerCase(),
                c = Math.abs(E.width - window.innerWidth) < 5;
              if (((t.tooltip.style.maxWidth = `${a.MAX_TOOLTIP_WIDTH}px`), c))
                (t.tooltip.style.left = a.FULL_WIDTH_TOOLTIP_OFFSET),
                  (t.tooltip.style.top = a.FULL_WIDTH_TOOLTIP_OFFSET);
              else {
                let p = Math.max(0, E.top - a.TOOLTIP_OFFSET);
                (t.tooltip.style.left = `${Math.max(0, E.left)}px`),
                  (t.tooltip.style.top = `${p}px`);
              }
              t.tooltip.textContent = g;
            } catch (E) {
              console.error("Error updating tooltip:", E), T();
            }
        },
        h = (n) => {
          let E =
            Math.abs(n.getBoundingClientRect().width - window.innerWidth) < 5;
          n.setAttribute(a.HOVERED_ATTR, "true"),
            E && n.setAttribute("data-full-width", "true");
        },
        u = (n) => {
          n.removeAttribute(a.HOVERED_ATTR),
            n.removeAttribute("data-full-width"),
            (n.style.cursor = "");
        },
        l = (n) => {
          let E = n.tagName.toLowerCase() === "svg",
            g = n.closest("svg") !== null;
          return !E && g;
        },
        r = o((n) => {
          if (
            !t.isActive ||
            !R(n.target) ||
            n.target.tagName.toLowerCase() === "html" ||
            l(n.target)
          )
            return;
          if (t.hoveredElement) {
            let c = `[data-component-path="${t.hoveredElement.getAttribute(
              "data-component-path"
            )}"][data-component-file="${t.hoveredElement.getAttribute(
              "data-component-file"
            )}"][data-component-line="${t.hoveredElement.getAttribute(
              "data-component-line"
            )}"]`;
            document.querySelectorAll(c).forEach((L) => {
              L.classList.contains("gpt-selected-element") || u(L);
            });
          }
          t.hoveredElement = n.target;
          let E = `[data-component-path="${n.target.getAttribute(
            "data-component-path"
          )}"][data-component-file="${n.target.getAttribute(
            "data-component-file"
          )}"][data-component-line="${n.target.getAttribute(
            "data-component-line"
          )}"]`;
          document.querySelectorAll(E).forEach((c) => {
            c.classList.contains("gpt-selected-element") || h(c);
          }),
            s(t.hoveredElement),
            t.tooltip &&
              ((t.tooltip.style.display = "block"),
              (t.tooltip.style.opacity = "1"));
        }, a.DEBOUNCE_DELAY),
        d = o(() => {
          if (t.isActive) {
            if (t.hoveredElement) {
              let n = `[data-component-path="${t.hoveredElement.getAttribute(
                "data-component-path"
              )}"][data-component-file="${t.hoveredElement.getAttribute(
                "data-component-file"
              )}"][data-component-line="${t.hoveredElement.getAttribute(
                "data-component-line"
              )}"]`;
              document.querySelectorAll(n).forEach((g) => {
                g.removeAttribute(a.HOVERED_ATTR),
                  g.hasAttribute(a.SELECTED_ATTR) || u(g);
              }),
                (t.hoveredElement = null);
            }
            T();
          }
        }, a.DEBOUNCE_DELAY),
        T = () => {
          t.tooltip &&
            ((t.tooltip.style.opacity = "0"),
            (t.tooltip.style.display = "none"));
        },
        _ = () => {
          t.scrollTimeout && clearTimeout(t.scrollTimeout),
            T(),
            t.hoveredElement &&
              !t.hoveredElement.classList.contains("gpt-selected-element") &&
              u(t.hoveredElement),
            (t.scrollTimeout = setTimeout(() => {
              t.scrollTimeout = null;
              let n = document.elementFromPoint(t.mouseX, t.mouseY);
              n && t.isActive && r({ target: n });
            }, a.SCROLL_DEBOUNCE));
        },
        O = (n) => {
          t.isActive &&
            n.target &&
            n.target instanceof HTMLElement &&
            ["input", "textarea", "select"].includes(
              n.target.tagName.toLowerCase()
            ) &&
            n.preventDefault();
        },
        A = (n) => {
          if (t.isActive) return n.preventDefault(), n.stopPropagation(), !1;
        },
        P = () => {
          document.addEventListener("mouseover", r),
            document.addEventListener("mouseout", d),
            document.addEventListener("click", x, !0),
            document.addEventListener("dblclick", V, !0),
            window.addEventListener("scroll", _, { passive: !0 }),
            document.addEventListener("mousedown", O, !0);
          let n = document.createElement("style");
          (n.textContent = `
        * {
          transition: none !important;
          animation: none !important;
          translate: none !important;
          scroll-behavior: auto !important;
        }
      `),
            document.head.appendChild(n),
            (t.styleElement = n),
            document.addEventListener("click", A, !0),
            document.addEventListener("submit", A, !0),
            document.addEventListener("touchstart", A, !0),
            document.addEventListener("touchend", A, !0);
        },
        C = () => {
          document.removeEventListener("mouseover", r),
            document.removeEventListener("mouseout", d),
            document.removeEventListener("click", x),
            window.removeEventListener("scroll", _),
            document.removeEventListener("mousedown", O, !0),
            document.removeEventListener("click", A, !0),
            document.removeEventListener("submit", A, !0),
            document.removeEventListener("touchstart", A, !0),
            document.removeEventListener("touchend", A, !0),
            t.styleElement &&
              (t.styleElement.remove(), (t.styleElement = null)),
            (document.body.style.cursor = ""),
            (document.body.style.userSelect = ""),
            (document.body.style.msUserSelect = ""),
            (document.body.style.mozUserSelect = ""),
            t.hoveredElement &&
              (t.hoveredElement.hasAttribute(a.SELECTED_ATTR) ||
                u(t.hoveredElement),
              (t.hoveredElement = null)),
            T();
        },
        F = (n) => {
          if (n.key === "Escape" && t.isActive) {
            n.preventDefault(),
              n.stopPropagation(),
              y({ type: "TOGGLE_PICK_AND_EDIT_REQUESTED", payload: !1 });
            return;
          }
          ((n.altKey && n.key.toLowerCase() === "s") || n.key === "\xDF") &&
            (n.preventDefault(),
            n.stopPropagation(),
            y({ type: "TOGGLE_PICK_AND_EDIT_REQUESTED", payload: null }));
        },
        U = (n, E) => document.elementFromPoint(n, E),
        G = (n) => {
          try {
            if (
              !n?.origin ||
              !n?.data?.type ||
              !a.ALLOWED_ORIGINS.includes(n.origin)
            )
              return;
            switch (n.data.type) {
              case "TOGGLE_SELECTOR":
                let E = !!n.data.payload;
                if (t.isActive !== E)
                  if (((t.isActive = E), t.isActive)) {
                    let c = U(t.mouseX, t.mouseY);
                    c && r({ target: c }), P();
                  } else
                    C(),
                      document
                        .querySelectorAll(
                          `[${a.HOVERED_ATTR}], [data-full-width]`
                        )
                        .forEach((p) => {
                          p.hasAttribute(a.SELECTED_ATTR) ||
                            (u(p),
                            p instanceof HTMLElement && (p.style.cursor = ""));
                        }),
                      t.reset();
                break;
              case "UPDATE_SELECTED_ELEMENTS":
                if (!Array.isArray(n.data.payload)) {
                  console.error("Invalid payload for UPDATE_SELECTED_ELEMENTS");
                  return;
                }
                document
                  .querySelectorAll(`[${a.SELECTED_ATTR}], [${a.HOVERED_ATTR}]`)
                  .forEach((c) => {
                    c.removeAttribute(a.SELECTED_ATTR),
                      c.removeAttribute(a.HOVERED_ATTR),
                      c.removeAttribute("data-full-width");
                  }),
                  n.data.payload.forEach((c) => {
                    if (!c?.filePath || !c?.fileName || !c?.lineNumber) {
                      console.error("Invalid element data:", c);
                      return;
                    }
                    let { filePath: p, fileName: L, lineNumber: m } = c,
                      b = `[data-component-path="${p}"][data-component-file="${L}"][data-component-line="${m}"]`;
                    document.querySelectorAll(b).forEach((D) => {
                      D.setAttribute(a.SELECTED_ATTR, "true"),
                        Math.abs(
                          D.getBoundingClientRect().width - window.innerWidth
                        ) < 5 && D.setAttribute("data-full-width", "true");
                    });
                  });
                break;
              case "GET_SELECTOR_STATE":
                y({
                  type: "SELECTOR_STATE_RESPONSE",
                  payload: { isActive: t.isActive },
                });
                break;
              case "SET_ELEMENT_CONTENT":
                {
                  let { id: c, content: p } = n.data.payload,
                    L = `[data-component-path="${c.path}"][data-component-line="${c.line}"]`;
                  document.querySelectorAll(L).forEach((b) => {
                    b.innerHTML = p;
                  });
                }
                break;
              case "SET_ELEMENT_ATTRS":
                {
                  let { id: c, attrs: p } = n.data.payload,
                    L = `[data-component-path="${c.path}"][data-component-line="${c.line}"]`;
                  document.querySelectorAll(L).forEach((b) => {
                    Object.keys(p).forEach((w) => {
                      b.setAttribute(w, p[w]);
                    });
                  });
                }
                break;
              case "DUPLICATE_ELEMENT_REQUESTED": {
                let { id: c } = n.data.payload,
                  p = `[data-component-path="${c.path}"][data-component-line="${c.line}"]`;
                document.querySelectorAll(p).forEach((m) => {
                  let b = m.cloneNode(!0);
                  b.setAttribute("data-component-path", "x"),
                    b.setAttribute("data-component-line", "x"),
                    b.setAttribute("data-component-file", "x"),
                    b.setAttribute("data-lov-tmp", "true"),
                    m.parentElement?.appendChild(b);
                });
                break;
              }
              case "SET_STYLESHEET": {
                let { stylesheet: c } = n.data.payload,
                  p = document.getElementById(a.OVERRIDE_STYLESHEET_ID);
                if (p) p.innerHTML = c;
                else {
                  let L = document.getElementsByTagName("head")[0],
                    m = document.createElement("style");
                  (m.id = a.OVERRIDE_STYLESHEET_ID),
                    (m.innerHTML = c),
                    L.appendChild(m);
                }
                break;
              }
              case "EDIT_TEXT_REQUESTED": {
                let { id: c } = n.data.payload,
                  p = `[data-component-path="${c.path}"][data-component-line="${c.line}"]`;
                document.querySelectorAll(p).forEach((m) => {
                  if (!(m instanceof HTMLElement)) return;
                  m.setAttribute("contenteditable", "true"), m.focus();
                  let b = () => {
                      y({
                        type: "ELEMENT_TEXT_UPDATED",
                        payload: { id: c, content: m.innerText },
                      });
                    },
                    w = () => {
                      m.removeAttribute("contenteditable"),
                        m.removeEventListener("input", b),
                        m.removeEventListener("blur", w);
                    };
                  m.addEventListener("input", b), m.addEventListener("blur", w);
                });
                break;
              }
              case "HOVER_ELEMENT_REQUESTED": {
                let { id: c } = n.data.payload;
                document
                  .querySelectorAll(`[${a.HOVERED_ATTR}]`)
                  .forEach((m) => {
                    m.removeAttribute(a.HOVERED_ATTR);
                  });
                let p = `[data-component-path="${c.path}"][data-component-line="${c.line}"]`;
                document.querySelectorAll(p).forEach((m) => {
                  m.setAttribute(a.HOVERED_ATTR, "true");
                });
                break;
              }
              case "UNHOVER_ELEMENT_REQUESTED": {
                let { id: c } = n.data.payload,
                  p = `[data-component-path="${c.path}"][data-component-line="${c.line}"]`;
                document.querySelectorAll(p).forEach((m) => {
                  m.removeAttribute(a.HOVERED_ATTR);
                });
                break;
              }
              case "REQUEST_COMPONENT_TREE":
                break;
              default:
                console.warn("Unknown message type:", n.data.type);
            }
          } catch (E) {
            console.error("Error handling message:", E), C(), t.reset();
          }
        },
        K = (n) => {
          (t.mouseX = n.clientX), (t.mouseY = n.clientY);
        },
        j = () => {
          y({ type: "REQUEST_PICKER_STATE" }),
            y({ type: "REQUEST_SELECTED_ELEMENTS" });
        };
      (() => {
        try {
          i(),
            window.addEventListener("message", G),
            document.addEventListener("keydown", F),
            document.addEventListener("mousemove", K),
            y({ type: "SELECTOR_SCRIPT_LOADED" }),
            j();
        } catch (n) {
          console.error("Failed to initialize selector script:", n);
        }
      })();
      let x = (n) => {
          if (
            t.isActive &&
            !(
              !R(n.target) ||
              n.target.tagName.toLowerCase() === "html" ||
              l(n.target)
            ) &&
            (n.preventDefault(), n.stopPropagation(), t.hoveredElement)
          ) {
            let E = k(t.hoveredElement);
            t.hoveredElement.setAttribute(a.SELECTED_ATTR, "true"),
              Math.abs(
                t.hoveredElement.getBoundingClientRect().width -
                  window.innerWidth
              ) < 5 && t.hoveredElement.setAttribute("data-full-width", "true"),
              y({
                type: "ELEMENT_CLICKED",
                payload: E,
                isMultiSelect: n.metaKey || n.ctrlKey,
              });
          }
        },
        V = (n) => {
          if (
            !t.isActive ||
            !R(n.target) ||
            n.target.tagName.toLowerCase() === "html" ||
            l(n.target)
          )
            return;
          n.preventDefault(), n.stopPropagation();
          let E = k(n.target);
          y({ type: "ELEMENT_DOUBLE_CLICKED", payload: E });
        };
    };
  var z = () => {
    if (window.location.search.includes("local-override-script")) {
      let e = "http://localhost:3000";
      console.log("Overriding script with:", e);
      let t = document.createElement("script");
      (t.src = e), document.body.appendChild(t);
      return;
    }
    window.top !== window.self && (I(), $(), v(), M());
  };
  z();
})();
