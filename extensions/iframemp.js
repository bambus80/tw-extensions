// Name: Iframe Multipage
// ID: iframeMP
// Description: Display multiple webpages/HTML over the stage. Based on the official "iframe" extension.
// Context: "iframe" is an HTML element that lets websites embed other websites.
// License: MIT AND MPL-2.0

(function (Scratch) {
  "use strict";

  // /** 
  //  * @typedef @typedef {{content: HTMLIFrameElement, trusted: boolean, x: number, y: number, width: number, height: number, interactive: string, resizeBehavior: string, latestMessage: any}} IframeMP
  //  * @type {{keys?: IframeMP}} */
  let loadedIframes = {}
  let overlay = null;

  const featurePolicy = {
    accelerometer: "'none'",
    "ambient-light-sensor": "'none'",
    battery: "'none'",
    camera: "'none'",
    "display-capture": "'none'",
    "document-domain": "'none'",
    "encrypted-media": "'none'",
    fullscreen: "'none'",
    geolocation: "'none'",
    gyroscope: "'none'",
    magnetometer: "'none'",
    microphone: "'none'",
    midi: "'none'",
    payment: "'none'",
    "picture-in-picture": "'none'",
    "publickey-credentials-get": "'none'",
    "speaker-selection": "'none'",
    usb: "'none'",
    vibrate: "'none'",
    vr: "'none'",
    "screen-wake-lock": "'none'",
    "web-share": "'none'",
    "interest-cohort": "'none'",
  };

  const SANDBOX = [
    "allow-same-origin",
    "allow-scripts",
    "allow-forms",
    "allow-modals",
    "allow-popups",
    // The big one we don't want to include is allow-top-navigation
  ];

  const updateFrameAttributes = (name) => {
    if (!loadedIframes[name]) {
      return;
    }

    const iframe = loadedIframes[name];
    const x = iframe.x;
    const y = iframe.y;

    iframe.content.style.pointerEvents = iframe.interactive ? "auto" : "none";

    const { stageWidth, stageHeight } = Scratch.vm.runtime;
    const effectiveWidth = iframe.width >= 0 ? iframe.width : stageWidth;
    const effectiveHeight = iframe.height >= 0 ? iframe.height : stageHeight;
    console.log(`iiframe "${name}" size ${effectiveWidth}x${effectiveHeight} at x:${x} y:${y}`)

    if (iframe.resizeBehavior === "scale") {
      iframe.content.style.width = `${effectiveWidth}px`;
      iframe.content.style.height = `${effectiveHeight}px`;

      iframe.content.style.transform = `translate(${-effectiveWidth / 2 + x}px, ${
        -effectiveHeight / 2 - y
      }px)`;
      iframe.content.style.top = "0";
      iframe.content.style.left = "0";
    } else {
      // As the stage is resized in fullscreen mode, only % can be relied upon
      iframe.content.style.width = `${(effectiveWidth / stageWidth) * 100}%`;
      iframe.content.style.height = `${(effectiveHeight / stageHeight) * 100}%`;

      iframe.content.style.transform = "";
      iframe.content.style.top = `${
        (0.5 - effectiveHeight / 2 / stageHeight - y / stageHeight) * 100
      }%`;
      iframe.content.style.left = `${
        (0.5 - effectiveWidth / 2 / stageWidth + x / stageWidth) * 100
      }%`;
    }
    // loadedIframes[name] = frame;
  };

  const updateAllFrames = () => {
    Object.keys(loadedIframes).forEach((key) => updateFrameAttributes(key));
  }

  const getOverlayMode = (name) =>
    loadedIframes[name].resizeBehavior === "scale" ? "scale-centered" : "manual";

  const createFrame = (name, src) => {
    const iframe = document.createElement("iframe");

    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.position = "absolute";
    iframe.setAttribute("sandbox", SANDBOX.join(" "));
    iframe.setAttribute(
      "allow",
      Object.entries(featurePolicy)
        .map(([name, permission]) => `${name} ${permission}`)
        .join("; ")
    );
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("src", src);

    loadedIframes[name] = {
      content: iframe,
      trusted: false,
      x: 0,
      y: 0,
      width: -1,  // negative means default
      height: -1, // negative means default
      interactive: true,
      resizeBehavior: "scale",
      latestMessage: null
    }
    overlay = Scratch.renderer.addOverlay(iframe, getOverlayMode(name));
    updateFrameAttributes(name);
  };

  const closeFrame = (name) => {
    if (loadedIframes[name]) {
      Scratch.renderer.removeOverlay(loadedIframes[name].content);
      delete loadedIframes[name];
    }
  };

  // const handleFrameMessage = (e) => {
  //   if (isTrusted) {
  //     latestMessage = e.data;
  //     Scratch.vm.runtime.startHats("iframe_whenMessage");
  //   }
  // };
  // window.onmessage = handleFrameMessage;

  Scratch.vm.on("STAGE_SIZE_CHANGED", updateAllFrames);

  Scratch.vm.runtime.on("RUNTIME_DISPOSED", closeFrame);

  class IframeExtension {
    getInfo() {
      return {
        name: Scratch.translate("Iframe Multipage (BETA)"),
        id: "iframeMP",
        color1: "#206593",
        blocks: [
          {
            opcode: "display",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("create/reload iframe named [NAME] with URL [URL]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              URL: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "https://extensions.turbowarp.org/hello.html",
              },
            },
          },
          {
            opcode: "displayHTML",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("create/reload iframe named [NAME] with HTML [HTML]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              HTML: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: `<h1>${Scratch.translate("It works!")}</h1>`,
              },
            },
          },
          "---",
          {
            opcode: "show",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("show iframe [NAME]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
            }
          },
          {
            opcode: "hide",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("hide iframe [NAME]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
            }
          },
          {
            opcode: "close",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("delete iframe [NAME]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
            }
          },
          "---",
          {
            opcode: "get",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("iframe [NAME] [MENU]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              MENU: {
                type: Scratch.ArgumentType.STRING,
                menu: "getMenu",
              },
            },
          },
          {
            opcode: "setXY",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set iframe [NAME] position to x:[X] y:[Y]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              X: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
              Y: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: "0",
              },
            },
          },
          {
            opcode: "setSize",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set iframe [NAME] size to x:[WIDTH] y:[HEIGHT]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              WIDTH: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: Scratch.vm.runtime.stageWidth,
              },
              HEIGHT: {
                type: Scratch.ArgumentType.NUMBER,
                defaultValue: Scratch.vm.runtime.stageHeight,
              },
            },
          },
          {
            opcode: "setInteractive",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set iframe [NAME] interactive to [INTERACTIVE]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              INTERACTIVE: {
                type: Scratch.ArgumentType.STRING,
                menu: "interactiveMenu",
              },
            },
          },
          {
            opcode: "setResize",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("set iframe [NAME] resize behavior to [RESIZE]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
              RESIZE: {
                type: Scratch.ArgumentType.STRING,
                menu: "resizeMenu",
              },
            },
          },
          "---",
          {
            opcode: "allIfamesObj",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("all iframe data (as object)"),
            disableMonitor: true,
          },
          // {
          //   opcode: "allIfamesJSON",
          //   blockType: Scratch.BlockType.REPORTER,
          //   text: Scratch.translate("all iframe data (as JSON)"),
          //   disableMonitor: true,
          // },
          "---",
          {
            opcode: "sendMessage",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("send message [MESSAGE] to iframe [NAME]"),
            arguments: {
              MESSAGE: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "hello",
              },
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
            },
          },
          {
            opcode: "clearMessage",
            blockType: Scratch.BlockType.COMMAND,
            text: Scratch.translate("clear iframe message in [NAME]"),
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              },
            }
          },
          {
            opcode: "whenMessage",
            blockType: Scratch.BlockType.EVENT,
            text: Scratch.translate("when message from iframe is sent"),
            isEdgeActivated: false,
          },
          {
            opcode: "iframeMessage",
            blockType: Scratch.BlockType.REPORTER,
            text: Scratch.translate("iframe message from [NAME]"),
            disableMonitor: true,
            arguments: {
              NAME: {
                type: Scratch.ArgumentType.STRING,
                defaultValue: "my iframe",
              }
            }
          },
        ],
        menus: {
          getMenu: {
            acceptReporters: true,
            items: [
              Scratch.translate("url"),
              Scratch.translate("visible"),
              "x",
              "y",
              Scratch.translate("width"),
              Scratch.translate("height"),
              Scratch.translate("interactive"),
              Scratch.translate("resize behavior"),
            ],
          },
          interactiveMenu: {
            acceptReporters: true,
            items: [
              // The getter blocks will return English regardless of translating these
              "true",
              "false",
            ],
          },
          resizeMenu: {
            acceptReporters: true,
            items: [
              {
                text: Scratch.translate("scale"),
                value: "scale",
              },
              {
                text: Scratch.translate("viewport"),
                value: "viewport",
              },
            ],
          },
        },
      };
    }

    display({ NAME, URL }) {
      if (!(NAME && URL)) return;
      closeFrame(NAME);
      createFrame(NAME, URL);
      loadedIframes[NAME].trusted = false;
    }

    displayHTML({ NAME, HTML }) {
      if (!(NAME && HTML)) return;
      closeFrame(NAME);
      const url = `data:text/html;,${encodeURIComponent(
        Scratch.Cast.toString(HTML)
      )}`;
      createFrame(NAME, url);
      loadedIframes[NAME].trusted = true;
    }

    show({ NAME }) {
      if (loadedIframes[NAME]) {
        loadedIframes[NAME].content.style.display = "";
      }
    }

    hide({ NAME }) {
      if (loadedIframes[NAME]) {
        loadedIframes[NAME].content.style.display = "none";
      }
    }

    close({ NAME }) {
      if (!NAME) return;
      closeFrame(NAME);
    }

    get({ NAME, MENU }) {
      if (!(loadedIframes[NAME] && MENU)) return "";
      const selectedIframe = loadedIframes[NAME];

      const iframe = selectedIframe.content;
      const width = selectedIframe.width;
      const height = selectedIframe.height;
      MENU = Scratch.Cast.toString(MENU);
      if (MENU === "url") {
        if (iframe) return iframe.getAttribute("src");
        return "";
      } else if (MENU === "visible") {
        return !!iframe && iframe.style.display !== "none";
      } else if (MENU === "x") {
        return selectedIframe.x;
      } else if (MENU === "y") {
        return selectedIframe.y;
      } else if (MENU === "width") {
        return width >= 0 ? width : Scratch.vm.runtime.stageWidth;
      } else if (MENU === "height") {
        return height >= 0 ? height : Scratch.vm.runtime.stageHeight;
      } else if (MENU === "interactive") {
        return selectedIframe.interactive;
      } else if (MENU === "resize behavior") {
        return selectedIframe.resizeBehavior;
      } else {
        return "";
      }
    }

    setXY({ NAME, X, Y }) {
      if (!(NAME) || X === undefined || Y === undefined) return;
      [X, Y] = [Scratch.Cast.toNumber(X), Scratch.Cast.toNumber(Y)];
      loadedIframes[NAME].x = X;
      loadedIframes[NAME].y = Y;
      updateFrameAttributes(NAME);
    }

    setSize({ NAME, WIDTH, HEIGHT }) {
      if (!(NAME && WIDTH && HEIGHT)) return;
      [WIDTH, HEIGHT] = [Scratch.Cast.toNumber(WIDTH), Scratch.Cast.toNumber(HEIGHT)];
      loadedIframes[NAME].width = WIDTH;
      loadedIframes[NAME].height = HEIGHT;
      updateFrameAttributes(NAME);
    }

    setInteractive({ NAME, INTERACTIVE }) {
      if (!(NAME && INTERACTIVE)) return;
      loadedIframes[NAME].interactive = Scratch.Cast.toBoolean(INTERACTIVE);
      updateFrameAttributes(NAME);
    }

    setResize({ NAME, RESIZE }) {
      if (!(NAME && RESIZE)) return;
      if (RESIZE === "scale" || RESIZE === "viewport") {
        loadedIframes[NAME].resizeBehavior = RESIZE;
        if (overlay) {
          overlay.mode = getOverlayMode(name);
          Scratch.renderer._updateOverlays();
          updateFrameAttributes();
        }
      }
    }

    allIfamesObj() {
      // const iframes = Object.values(loadedIframes).map((iframe) => {
      //   iframe.content = iframe.content.getAttribute("src")
      //   return iframe;
      // })
      // return iframes;
      return loadedIframes;
    }

    // allIfamesJSON() {
    //   return JSON.stringify(this.allIfamesObj());
    // }

    sendMessage({ NAME, MESSAGE }) {
      if (!(NAME && MESSAGE)) return;
      if (!loadedIframes[NAME]) return;
      if (loadedIframes[NAME].trusted) {
        loadedIframes[NAME].content.contentWindow.postMessage(MESSAGE, "*");
      }
    }

    clearMessage({ NAME }) {
      if (!loadedIframes[NAME]) return;
      loadedIframes[NAME].latestMessage = null;
    }

    iframeMessage({ NAME }) {
      if (!loadedIframes[NAME]) return "";
      return loadedIframes[NAME].latestMessage;
    }
  }

  // @ts-ignore
  Scratch.extensions.register(new IframeExtension());
})(Scratch);
