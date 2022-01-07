with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    yarn
    nodejs
    ripgrep
    postgresql
    jq
    httpie
  ];

  shellHook = ''
    PATH=$PATH:~/.yarn/bin
  '';
}
