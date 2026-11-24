// Acceso al ranking: habla con la API del servidor (servidor/servidor.js), que guarda todo en MySQL.
const Cloud = {
  validAlias(a) {
    return /^[\p{L}\p{N}_ ]{3,12}$/u.test(a);
  },

  async _req(path, opts = {}) {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 6000); // timeout de 6 s
    try {
      const res = await fetch(CONFIG.API_URL + path, {
        ...opts,
        signal: ctl.signal,
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const txt = await res.text();
      return txt ? JSON.parse(txt) : null;
    } finally {
      clearTimeout(timer);
    }
  },

  saveScore(alias, puntos, nivel) {
    if (!this.validAlias(alias)) return Promise.reject(new Error('alias inválido'));
    puntos = Math.max(0, Math.min(CONFIG.MAX_SCORE, Math.floor(puntos)));
    return this._req('/partidas', {
      method: 'POST',
      body: JSON.stringify({ alias, puntos, nivel })
    });
  },

  top10() {
    return this._req('/ranking');
  }
};
