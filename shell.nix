with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    ripgrep
    postgresql
    jq
    httpie
  ];

  shellHook = ''
    PATH=$PATH:~/.yarn/bin
  '';
}
