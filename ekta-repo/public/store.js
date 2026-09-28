/* ------------------------------------------------------------------
   Store — the only place that talks to the database.

   Backed by Supabase (PostgREST) when config.js is filled in.
   Falls back to this browser's localStorage in demo mode, so the page
   still works before the database exists. Demo data is NOT shared.

   The rest of the app never touches the network directly.
   ------------------------------------------------------------------ */

(function () {
  var CFG = window.EKTA_CONFIG || {};
  var LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
  var TABLE = CFG.TABLE || "work_items";
  var LS_KEY = "ekta.demo.items";

  /* Database column names are snake_case; the app uses camelCase. */
  function fromRow(r) {
    return {
      id: r.id,
      emp: r.emp,
      empName: r.emp_name,
      cat: r.cat,
      customer: r.customer,
      expected: r.expected,
      actual: r.actual,
      status: r.status,
      reason: r.reason || "",
      next: r.next_action || "",
      due: r.due || "",
      remarks: r.remarks || "",
      logDate: r.log_date || "",
      completedOn: r.completed_on || ""
    };
  }

  function url(path) {
    return CFG.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" + path;
  }

  function headers(extra) {
    var h = {
      apikey: CFG.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + CFG.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    };
    for (var k in extra || {}) h[k] = extra[k];
    return h;
  }

  async function send(path, options) {
    var res = await fetch(url(path), options);
    if (!res.ok) {
      var body = "";
      try { body = await res.text(); } catch (e) {}
      var err = new Error("Database error " + res.status + ": " + body);
      err.status = res.status;
      err.denied = res.status === 401 || res.status === 403;
      throw err;
    }
    if (res.status === 204) return null;
    var text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /* ---------- demo mode ---------- */
  function demoRead() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch (e) { return []; }
  }
  function demoWrite(rows) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(rows)); }
    catch (e) {}
  }

  window.Store = {
    live: LIVE,

    /** Every work item, newest first. */
    async list() {
      if (!LIVE) {
        var err = new Error("Not configured");
        err.setup = true;
        // Demo mode still returns rows so the page is usable.
        var rows = demoRead().map(fromRow);
        if (!rows.length) throw err;
        return rows;
      }
      var rows = await send(
        TABLE + "?select=*&order=updated_at.desc&limit=2000",
        { headers: headers() }
      );
      return (rows || []).map(fromRow);
    },

    /** Insert one new work item. */
    async create(row) {
      row.updated_at = new Date().toISOString();
      if (!LIVE) {
        var rows = demoRead();
        rows.unshift(row);
        demoWrite(rows);
        return;
      }
      await send(TABLE, {
        method: "POST",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify(row)
      });
    },

    /** Merge fields into an existing item. */
    async update(id, patch) {
      patch.updated_at = new Date().toISOString();
      if (!LIVE) {
        var rows = demoRead();
        for (var i = 0; i < rows.length; i++) {
          if (rows[i].id === id) {
            for (var k in patch) rows[i][k] = patch[k];
            break;
          }
        }
        demoWrite(rows);
        return;
      }
      await send(TABLE + "?id=eq." + encodeURIComponent(id), {
        method: "PATCH",
        headers: headers({ Prefer: "return=minimal" }),
        body: JSON.stringify(patch)
      });
    }
  };
})();
