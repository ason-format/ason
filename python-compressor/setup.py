from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="ason-compressor",
    version="2.0.0",
    author="ASON Contributors",
    description="ASON (Aliased Serialization Object Notation) - Token-optimized format for LLMs",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/ason-format/ason",
    project_urls={
        "Bug Tracker": "https://github.com/ason-format/ason/issues",
    },
    classifiers=[
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    package_dir={"": "src"},
    packages=find_packages(where="src"),
    python_requires=">=3.7",
)
