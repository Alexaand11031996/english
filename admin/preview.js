(function () {
  var h = window.h;
  var createClass = window.createClass;

  function g(entry, pathArr, fallback) {
    var val = entry.getIn(["data"].concat(pathArr));
    if (val === undefined || val === null) return fallback !== undefined ? fallback : "";
    if (typeof val.toJS === "function") return val.toJS();
    return val;
  }

  function bi(entry, pathArr) {
    return { ua: g(entry, pathArr.concat(["ua"]), ""), en: g(entry, pathArr.concat(["en"]), "") };
  }

  function photoBox(url, placeholderText, boxStyle) {
    var base = {
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      textAlign: "center"
    };
    var merged = Object.assign({}, base, boxStyle);
    if (url) {
      return h("div", { style: merged }, h("img", { src: url, style: { width: "100%", height: "100%", objectFit: "cover" } }));
    }
    return h(
      "div",
      {
        style: Object.assign({}, merged, {
          background: "linear-gradient(160deg, #20402E, #1A2E20), repeating-linear-gradient(135deg, rgba(244,241,232,0.04) 0 2px, transparent 2px 14px)",
          border: "1px solid rgba(244,241,232,0.1)",
          color: "#9FB6A4",
          fontSize: "12px",
          padding: "12px"
        })
      },
      placeholderText
    );
  }

  function collectPhotoPaths(entry) {
    var paths = [];
    var heroPhoto = g(entry, ["hero", "photo"], "");
    if (heroPhoto) paths.push(heroPhoto);
    var aboutPhoto = g(entry, ["about", "photo"], "");
    if (aboutPhoto) paths.push(aboutPhoto);
    g(entry, ["hero", "avatars"], []).forEach(function (avatar) {
      if (avatar.photo) paths.push(avatar.photo);
    });
    g(entry, ["testimonials", "items"], []).forEach(function (item) {
      if (item.photo) paths.push(item.photo);
    });
    return paths;
  }

  var SitePreview = createClass({
    getInitialState: function () {
      return { resolvedAssets: {} };
    },

    resolveAssets: function (entry) {
      var paths = collectPhotoPaths(entry);
      var signature = JSON.stringify(paths);
      if (signature === this._lastResolvedSignature) return;
      this._lastResolvedSignature = signature;

      var self = this;
      paths.forEach(function (path) {
        if (self.state.resolvedAssets[path] !== undefined) return;
        var result = self.props.getAsset(path);
        if (result && typeof result.then === "function") {
          result.then(function (asset) {
            var url = asset && asset.toString ? asset.toString() : asset;
            self.setState(function (prev) {
              var next = Object.assign({}, prev.resolvedAssets);
              next[path] = url;
              return { resolvedAssets: next };
            });
          }).catch(function () {
            self.setState(function (prev) {
              var next = Object.assign({}, prev.resolvedAssets);
              next[path] = "";
              return { resolvedAssets: next };
            });
          });
        } else {
          var url = result && result.toString ? result.toString() : result;
          self.setState(function (prev) {
            var next = Object.assign({}, prev.resolvedAssets);
            next[path] = url;
            return { resolvedAssets: next };
          });
        }
      });
    },

    componentDidMount: function () {
      this.resolveAssets(this.props.entry);
    },

    componentDidUpdate: function () {
      this.resolveAssets(this.props.entry);
    },

    assetUrl: function (path) {
      if (!path) return "";
      return this.state.resolvedAssets[path] || "";
    },

    render: function () {
      var entry = this.props.entry;
      var assetUrl = this.assetUrl.bind(this);

      var heroPhoto = assetUrl(g(entry, ["hero", "photo"], ""));
      var aboutPhoto = assetUrl(g(entry, ["about", "photo"], ""));

      var heroStats = g(entry, ["hero", "stats"], []);
      var heroAvatars = g(entry, ["hero", "avatars"], []);
      var teachCards = g(entry, ["teach", "cards"], []);
      var trustItems = g(entry, ["trust", "items"], []);
      var checklistItems = g(entry, ["about", "checklist"], []);
      var priceCards = g(entry, ["pricing", "cards"], []);
      var processSteps = g(entry, ["process", "steps"], []);
      var testimonialItems = g(entry, ["testimonials", "items"], []);
      var faqItems = g(entry, ["faq", "items"], []);

      var lang = "ua";

      return h(
        "div",
        { style: { fontFamily: "Inter, system-ui, sans-serif", background: "#F8F5EC", color: "#152219" } },
        h(
          "section",
          { style: { background: "#122016", color: "#F4F1E8", padding: "40px 32px" } },
          h("div", { style: { color: "#E8622C", fontSize: "12px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" } }, t(bi(entry, ["hero", "eyebrow"]), lang)),
          h("h1", { style: { fontFamily: "Georgia, serif", fontSize: "32px", margin: "0 0 14px" } }, renderAccentHtml ? h("span", { dangerouslySetInnerHTML: { __html: renderAccentHtml(t(bi(entry, ["hero", "h1"]), lang)) } }) : t(bi(entry, ["hero", "h1"]), lang)),
          h("p", { style: { color: "#9FB6A4", maxWidth: "480px", marginBottom: "16px" } }, t(bi(entry, ["hero", "lead"]), lang)),
          h(
            "div",
            { style: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "18px" } },
            h("div", { style: { background: "#E8622C", color: "#fff", borderRadius: "999px", padding: "10px 18px", fontSize: "13px", fontWeight: 600 } }, t(bi(entry, ["hero", "btnPrimary"]), lang)),
            h("div", { style: { background: "transparent", color: "#F4F1E8", border: "1.5px solid rgba(244,241,232,0.35)", borderRadius: "999px", padding: "10px 18px", fontSize: "13px", fontWeight: 600 } }, t(bi(entry, ["hero", "btnOutline"]), lang))
          ),
          h(
            "div",
            { style: { position: "relative", width: "220px", marginBottom: "16px" } },
            photoBox(heroPhoto, t(bi(entry, ["hero", "photoPlaceholder"]), lang), { width: "220px", height: "260px" }),
            h(
              "div",
              { style: { position: "absolute", top: "10px", left: "-16px", background: "#122016", border: "1.5px solid #C9E4B8", borderRadius: "999px", padding: "8px 12px", textAlign: "center", boxShadow: "0 10px 20px -8px rgba(0,0,0,0.5)" } },
              h("div", { style: { fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 700, color: "#C9E4B8" } }, g(entry, ["hero", "badges", 0, "num"], "")),
              h("div", { style: { fontSize: "8px", color: "#9FB6A4" } }, t(bi(entry, ["hero", "badges", 0, "label"]), lang))
            ),
            h(
              "div",
              { style: { position: "absolute", bottom: "12px", right: "-12px", background: "#E8622C", color: "#fff", borderRadius: "999px", padding: "9px 12px", textAlign: "center", boxShadow: "0 8px 16px -6px rgba(232,98,44,0.6)" } },
              h("div", { style: { fontFamily: "Georgia, serif", fontSize: "13px", fontWeight: 700 } }, g(entry, ["hero", "badges", 1, "num"], "")),
              h("div", { style: { fontSize: "8px" } }, t(bi(entry, ["hero", "badges", 1, "label"]), lang))
            )
          ),
          h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" } },
            heroAvatars.map(function (avatar, i) {
              var avatarUrl = assetUrl(avatar.photo);
              return h(
                "div",
                {
                  key: i,
                  style: {
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: "#E4F1DA", color: "#152219",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "10px", fontWeight: 700, overflow: "hidden",
                    marginLeft: i === 0 ? 0 : "-8px", border: "2px solid #122016"
                  }
                },
                avatarUrl ? h("img", { src: avatarUrl, style: { width: "100%", height: "100%", objectFit: "cover" } }) : (avatar.initial || "")
              );
            }),
            h("span", { style: { fontSize: "12px", color: "#9FB6A4", marginLeft: "6px" } }, t(bi(entry, ["hero", "proof"]), lang))
          ),
          h(
            "div",
            { style: { display: "flex", flexWrap: "wrap", gap: "10px" } },
            heroStats.map(function (stat, i) {
              return h(
                "div",
                { key: i, style: { background: "rgba(244,241,232,0.06)", border: "1px solid rgba(244,241,232,0.12)", borderRadius: "10px", padding: "8px 12px", minWidth: "90px" } },
                h("div", { style: { fontFamily: "Georgia, serif", color: "#C9E4B8", fontSize: "16px" } }, stat.num),
                h("div", { style: { fontSize: "10px", color: "#9FB6A4" } }, t(stat.label, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { background: "#122016", color: "#F4F1E8", padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "16px" } }, t(bi(entry, ["teach", "h2"]), lang)),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" } },
            teachCards.map(function (card, i) {
              return h(
                "div",
                { key: i, style: { background: "#1A2E20", border: "1px solid rgba(244,241,232,0.1)", borderRadius: "12px", padding: "16px" } },
                h("h3", { style: { fontSize: "14px", marginBottom: "6px" } }, t(card.t, lang)),
                h("p", { style: { fontSize: "12px", color: "#9FB6A4" } }, t(card.d, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { background: "#1A2E20", padding: "18px 32px", display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" } },
          trustItems.map(function (item, i) {
            return h("div", { key: i, style: { color: "#C9E4B8", fontSize: "12.5px" } }, "✓ " + t(item, lang));
          })
        ),

        h(
          "section",
          { style: { padding: "32px" } },
          h("div", { style: { color: "#E8622C", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" } }, t(bi(entry, ["about", "eyebrow"]), lang)),
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "10px" } }, t(bi(entry, ["about", "h2"]), lang)),
          photoBox(aboutPhoto, t(bi(entry, ["about", "photoPlaceholder"]), lang), { width: "180px", height: "200px", marginBottom: "12px" }),
          h("p", { style: { color: "#4F5F53", fontSize: "14px", marginBottom: "8px" } }, t(bi(entry, ["about", "p1"]), lang)),
          h("p", { style: { color: "#4F5F53", fontSize: "14px", marginBottom: "10px" } }, t(bi(entry, ["about", "p2"]), lang)),
          h(
            "ul",
            { style: { listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column", gap: "6px" } },
            checklistItems.map(function (item, i) {
              return h("li", { key: i, style: { fontSize: "13px", color: "#152219" } }, "✓ " + t(item, lang));
            })
          ),
          h("div", { style: { display: "inline-block", background: "#E8622C", color: "#fff", borderRadius: "999px", padding: "10px 18px", fontSize: "13px", fontWeight: 600 } }, t(bi(entry, ["about", "btn"]), lang))
        ),

        h(
          "section",
          { style: { background: "#EFEADB", padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "24px", marginBottom: "16px", textAlign: "center" } }, t(bi(entry, ["pricing", "h2"]), lang)),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" } },
            priceCards.map(function (card, i) {
              var featured = g(entry, ["pricing", "cards", i, "featured"], false);
              return h(
                "div",
                {
                  key: i,
                  style: {
                    background: featured ? "#122016" : "#fff",
                    color: featured ? "#F4F1E8" : "#152219",
                    borderRadius: "16px",
                    padding: "18px",
                    textAlign: "center",
                    border: "1px solid #E3DCC9"
                  }
                },
                h("div", { style: { fontSize: "11px", color: "#E8622C", marginBottom: "6px" } }, t(card.tag, lang)),
                h("h3", { style: { fontSize: "15px", marginBottom: "6px" } }, t(card.title, lang)),
                h("div", { style: { fontFamily: "Georgia, serif", fontSize: "20px" } }, t(card.price, lang) + " " + t(card.priceSuffix, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "14px", textAlign: "center" } }, t(bi(entry, ["process", "h2"]), lang)),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" } },
            processSteps.map(function (step, i) {
              return h(
                "div",
                { key: i, style: { background: "#fff", border: "1px solid #E3DCC9", borderRadius: "14px", padding: "14px" } },
                h("div", { style: { width: "26px", height: "26px", borderRadius: "50%", background: "#E8622C", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", marginBottom: "8px" } }, i + 1),
                h("h4", { style: { fontSize: "13px", marginBottom: "4px" } }, t(step.t, lang)),
                h("p", { style: { fontSize: "11.5px", color: "#4F5F53" } }, t(step.d, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { background: "#EFEADB", padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "14px", textAlign: "center" } }, t(bi(entry, ["testimonials", "h2"]), lang)),
          h(
            "div",
            { style: { display: "flex", gap: "12px", overflowX: "auto" } },
            testimonialItems.map(function (item, i) {
              var avatarUrl = assetUrl(item.photo);
              return h(
                "div",
                { key: i, style: { flex: "0 0 220px", background: "#fff", border: "1px solid #E3DCC9", borderRadius: "14px", padding: "14px" } },
                h("p", { style: { fontSize: "12px", marginBottom: "8px" } }, t(item.quote, lang)),
                h(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: "8px" } },
                  avatarUrl
                    ? h("img", { src: avatarUrl, style: { width: "28px", height: "28px", borderRadius: "50%", objectFit: "cover" } })
                    : h("div", { style: { width: "28px", height: "28px", borderRadius: "50%", background: "#E4F1DA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 } }, item.initial || ""),
                  h(
                    "div",
                    {},
                    h("div", { style: { fontSize: "12px", fontWeight: 700 } }, t(item.name, lang)),
                    h("div", { style: { fontSize: "11px", color: "#4F5F53" } }, t(item.role, lang))
                  )
                )
              );
            })
          )
        ),

        h(
          "section",
          { style: { padding: "32px" } },
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "14px", textAlign: "center" } }, t(bi(entry, ["faq", "h2"]), lang)),
          h(
            "div",
            { style: { maxWidth: "500px", margin: "0 auto" } },
            faqItems.map(function (item, i) {
              return h(
                "div",
                { key: i, style: { background: "#fff", border: "1px solid #E3DCC9", borderRadius: "10px", padding: "12px 16px", marginBottom: "8px" } },
                h("div", { style: { fontWeight: 600, fontSize: "13px" } }, t(item.q, lang)),
                h("div", { style: { fontSize: "12px", color: "#4F5F53", marginTop: "4px" } }, t(item.a, lang))
              );
            })
          )
        ),

        h(
          "section",
          { style: { background: "#122016", color: "#F4F1E8", padding: "36px 32px", textAlign: "center" } },
          h("div", { style: { color: "#C9E4B8", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", marginBottom: "10px" } }, t(bi(entry, ["cta", "eyebrow"]), lang)),
          h("h2", { style: { fontFamily: "Georgia, serif", fontSize: "22px", marginBottom: "8px" } }, t(bi(entry, ["cta", "h2"]), lang)),
          h("p", { style: { color: "#9FB6A4", fontSize: "13px", marginBottom: "18px" } }, t(bi(entry, ["cta", "p"]), lang)),
          h(
            "div",
            { style: { display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" } },
            h("div", { style: { background: "#E8622C", color: "#fff", borderRadius: "999px", padding: "10px 18px", fontSize: "13px", fontWeight: 600 } }, t(bi(entry, ["hero", "btnPrimary"]), lang)),
            h("div", { style: { background: "transparent", color: "#F4F1E8", border: "1.5px solid rgba(244,241,232,0.35)", borderRadius: "999px", padding: "10px 18px", fontSize: "13px", fontWeight: 600 } }, t(bi(entry, ["hero", "btnOutline"]), lang))
          )
        ),

        h(
          "section",
          { style: { background: "#1A2E20", color: "#9FB6A4", padding: "24px 32px", fontSize: "12px" } },
          h("div", { style: { marginBottom: "8px" } }, t(bi(entry, ["footer", "desc"]), lang)),
          "Telegram: @" + g(entry, ["contacts", "telegramUsername"], "") + " · Instagram: @" + g(entry, ["contacts", "instagramUsername"], "") + " · " + g(entry, ["contacts", "phone"], "") + " · " + g(entry, ["contacts", "email"], ""),
          h("div", { style: { marginTop: "8px", opacity: 0.7 } }, t(bi(entry, ["footer", "copy"]), lang))
        )
      );
    }
  });

  CMS.registerPreviewStyle("preview.css");
  CMS.registerPreviewTemplate("site", SitePreview);
})();
