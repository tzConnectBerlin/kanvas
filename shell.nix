with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    yarn
    nodejs
    ripgrep
    postgresql
    httpie
  ];

  shellHook = ''
    PATH=$PATH:~/.yarn/bin
  '';
}
