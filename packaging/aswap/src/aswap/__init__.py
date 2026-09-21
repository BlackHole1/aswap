"""The ``aswap`` command: claude-swap with the aswap patch series applied."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("aswap")
except PackageNotFoundError:  # running from a source checkout
    __version__ = "0.0.0"
