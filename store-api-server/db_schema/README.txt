folder structure:

migrations/
  holds primary db schema migration steps (applicable to all deployments)
procedures/
  defines/updates necessary set of db procedures
patches/
  _deployment_ specific patches

migrations/ are first applied, then procedures/, then patches/
