(() => {
  "use strict";

  // A page-world script is needed to register with csTimer's own scramble manager.
  if (window.__cstimerTurtleInstalled) return;
  window.__cstimerTurtleInstalled = true;

  // csTimer's worker does not load extensions. Its nocache_ convention keeps
  // this custom generator on the main thread without changing other scramblers.
  const TYPE = "nocache_mgmturtle";
  const arrows = { "-- --": "↲", "++ --": "↰", "++ ++": "↱", "-- ++": "↳" };

  function toTurtle(wca) {
    // csTimer uses ~ for non-breaking spaces and literal \\n for row breaks.
    const converted = wca.replace(/R(\+\+|--)[\s~]+D(\+\+|--)/g,
      (_, right, down) => arrows[`${right} ${down}`]);
    const modules = converted.split(/\\n|\r?\n/)
      .map(row => row.replace(/~/g, " ").trim())
      .filter(Boolean)
      // Keep each five-arrow module together even when the viewport is narrow.
      .map(row => row.replace(/\s+/g, "\u00a0"));
    const lines = [];
    for (let i = 0; i < modules.length; i += 2) {
      // Two em spaces provide a tab-sized gap and allow wrapping after U/U'.
      lines.push(modules.slice(i, i + 2).join("\u2003\u2003"));
    }
    return lines.join("\\n");
  }

  function addMenu(data) {
    if (!Array.isArray(data)) return;
    // Identify the category by its stable scrambler ID, independent of language.
    const entries = data.find(category => Array.isArray(category[1]) &&
      category[1].some(entry => entry[1] === "mgmc"))?.[1];
    if (!entries || entries.some(entry => entry[1] === TYPE)) return;
    const carrot = entries.findIndex(entry => entry[1] === "mgmc");
    entries.splice(carrot + 1, 0, ["Turtle", TYPE, 70]);
  }

  function register(manager) {
    if (!manager?.reg || !manager.scramblers) return;
    manager.reg(TYPE, (_type, length, state, neutrality) => {
      const wca = manager.scramblers.mgmp("mgmp", length, state, neutrality);
      // Preserve csTimer's delayed-generation contract if it is ever used here.
      return typeof wca === "string" ? toTurtle(wca) : wca;
    });
  }

  function onGlobal(name, install) {
    if (window[name] !== undefined) {
      install(window[name]);
      return;
    }
    // Install synchronously as each global is assigned: before TwoLvMenu is
    // constructed and before csTimer restores the saved scramble/session type.
    // Replace the one-shot accessor with an ordinary property immediately.
    Object.defineProperty(window, name, {
      configurable: true,
      get: () => undefined,
      set(value) {
        Object.defineProperty(window, name, {
          value, writable: true, enumerable: true, configurable: true
        });
        install(value);
      }
    });
  }

  onGlobal("scrdata", addMenu);
  onGlobal("scrMgr", register);
})();
