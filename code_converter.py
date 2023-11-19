import openai
import streamlit as st
import streamlit.components.v1 as components

openai.api_key = "put your api key here"
from streamlit_ace import st_ace, KEYBINDINGS, THEMES, LANGUAGES


st.set_page_config(layout="wide")

languages = [
    "abap",
    "abc",
    "actionscript",
    "ada",
    "alda",
    "apache_conf",
    "apex",
    "applescript",
    "aql",
    "asciidoc",
    "asl",
    "assembly_x86",
    "autohotkey",
    "batchfile",
    "c9search",
    "c_cpp",
    "cirru",
    "clojure",
    "cobol",
    "coffee",
    "coldfusion",
    "crystal",
    "csharp",
    "csound_document",
    "csound_orchestra",
    "csound_score",
    "csp",
    "css",
    "curly",
    "d",
    "dart",
    "diff",
    "django",
    "dockerfile",
    "dot",
    "drools",
    "edifact",
    "eiffel",
    "ejs",
    "elixir",
    "elm",
    "erlang",
    "forth",
    "fortran",
    "fsharp",
    "fsl",
    "ftl",
    "gcode",
    "gherkin",
    "gitignore",
    "glsl",
    "gobstones",
    "golang",
    "graphqlschema",
    "groovy",
    "haml",
    "handlebars",
    "haskell",
    "haskell_cabal",
    "haxe",
    "hjson",
    "html",
    "html_elixir",
    "html_ruby",
    "ini",
    "io",
    "jack",
    "jade",
    "java",
    "javascript",
    "json",
    "json5",
    "jsoniq",
    "jsp",
    "jssm",
    "jsx",
    "julia",
    "kotlin",
    "latex",
    "less",
    "liquid",
    "lisp",
    "livescript",
    "logiql",
    "logtalk",
    "lsl",
    "lua",
    "luapage",
    "lucene",
    "makefile",
    "markdown",
    "mask",
    "matlab",
    "maze",
    "mediawiki",
    "mel",
    "mixal",
    "mushcode",
    "mysql",
    "nginx",
    "nim",
    "nix",
    "nsis",
    "nunjucks",
    "objectivec",
    "ocaml",
    "pascal",
    "perl",
    "perl6",
    "pgsql",
    "php",
    "php_laravel_blade",
    "pig",
    "plain_text",
    "powershell",
    "praat",
    "prisma",
    "prolog",
    "properties",
    "protobuf",
    "puppet",
    "python",
    "qml",
    "r",
    "razor",
    "rdoc",
    "red",
    "redshift",
    "rhtml",
    "rst",
    "ruby",
    "rust",
    "sass",
    "scad",
    "scala",
    "scheme",
    "scss",
    "sh",
    "sjs",
    "slim",
    "smarty",
    "snippets",
    "soy_template",
    "space",
    "sparql",
    "sql",
    "sqlserver",
    "stylus",
    "svg",
    "swift",
    "tcl",
    "terraform",
    "tex",
    "text",
    "textile",
    "toml",
    "tsx",
    "turtle",
    "twig",
    "typescript",
    "vala",
    "vbscript",
    "velocity",
    "verilog",
    "vhdl",
    "visualforce",
    "wollok",
    "xml",
    "xquery",
    "yaml",
]
THEMES = [
    "ambiance",
    "chaos",
    "chrome",
    "clouds",
    "clouds_midnight",
    "cobalt",
    "crimson_editor",
    "dawn",
    "dracula",
    "dreamweaver",
    "eclipse",
    "github",
    "gob",
    "gruvbox",
    "idle_fingers",
    "iplastic",
    "katzenmilch",
    "kr_theme",
    "kuroir",
    "merbivore",
    "merbivore_soft",
    "mono_industrial",
    "monokai",
    "nord_dark",
    "pastel_on_dark",
    "solarized_dark",
    "solarized_light",
    "sqlserver",
    "terminal",
    "textmate",
    "tomorrow",
    "tomorrow_night",
    "tomorrow_night_blue",
    "tomorrow_night_bright",
    "tomorrow_night_eighties",
    "twilight",
    "vibrant_ink",
    "xcode",
]

st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inder');
    .container {
        display: flex;
    }
    .logo-text {
        font-family: 'Inder', sans-serif !important;
        font-size:50px !important;
        padding-left:15px !important;
        margin-top: 40px !important;
    }
    e
    .logo-img {
        float:left;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

st.markdown(
    f"""
    <div class="container">
        <img class="logo-img" src="https://cdn-icons-png.flaticon.com/128/2593/2593635.png">
        <div class="logo-text">Convert Code using Analyz!!!</div>
    </div>
    """,
    unsafe_allow_html=True,
)
st.write(
    "Analyz Large Language Models to convert your code to any language of your choosing!!!"
)

theme_color = st.selectbox("Select a theme", THEMES)
col1, col2 = st.columns(2)
code_response = ""
code = ""


with col1:
    st.header("Source Code")
    language_1 = st.selectbox("Select source language", languages)
    if st.button("Refresh Code"):
        code = ""
    code = st_ace(language=language_1, height=500, theme=theme_color)

with col2:
    st.header("Converted Code")
    language_2 = st.selectbox("Select end language", languages)
    if st.button("Convert Code"):
        with st.spinner("Converting..."):
            response = openai.Completion.create(
                engine="text-davinci-003",
                prompt=f"""
                        Convert {code} from {language_1} to {language_2} and add comments.
                        
                    """,
                max_tokens=1024,
                n=1,
                stop=None,
                temperature=0.7,
            )
            code_response = response.choices[0]["text"].strip()
    st_ace(
        code_response, language=language_2, height=500, theme=theme_color, key="output"
    )
