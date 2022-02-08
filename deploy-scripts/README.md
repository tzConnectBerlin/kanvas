# deploy-script directories semantics

All scripts inside setup/ are repeatable, they can (and are intended) to be used for not only initial installation of dependencies but also for rebuilds.

All scripts inside run/ do not rebuild before starting their component. They start whichever was the last build, and can thus deviate from src/ code semantics if not careful.
