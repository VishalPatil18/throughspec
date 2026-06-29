"""Stage 1 stub entry point.

Proves the build and distribution pipeline. Real command surface lands in Stage 4.
"""

from __future__ import annotations

from spec_init import __version__


def main() -> None:
    print(f"Throughspec spec-init v{__version__}")
    print("Stage 1 stub - real CLI lands in Stage 4.")


if __name__ == "__main__":
    main()
