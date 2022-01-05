with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    yarn
    ripgrep
    postgresql
    httpie
  ];

  shellHook = ''
    PATH=$PATH:~/.yarn/bin
  '';
}
