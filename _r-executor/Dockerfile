# ---------- Base Image with tidyverse pre-installed ----------
FROM rocker/tidyverse:4.3.1

# ---------- System Dependencies ----------
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    libcairo2-dev \
    libgsl-dev \
    libgmp-dev \
    libmpfr-dev \
    libudunits2-dev \
    libgdal-dev \
    libproj-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ---------- Python Dependencies ----------
RUN pip3 install --no-cache-dir fastapi uvicorn[standard] pydantic

# ---------- COMPREHENSIVE R Package Installation ----------
# Using Posit Package Manager for pre-compiled binaries (FAST!)

# Core statistical and plotting packages
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'ggpubr', 'GGally', 'ggridges', 'ggrepel', 'ggforce', 'ggsci', 'ggthemes', 'ggpmisc', \
      'rstatix', 'scales', 'viridis', 'reshape2', 'patchwork', 'cowplot', 'forcats', \
      'ggcorrplot', 'gridExtra', 'RColorBrewer', 'colorspace', 'paletteer' \
    ), Ncpus=2, dependencies=TRUE)"



# Data manipulation and processing
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'data.table', 'dtplyr', 'lubridate', 'hms', 'zoo', \
      'jsonlite', 'xml2', 'rvest', 'httr', 'curl' \
    ), Ncpus=2, dependencies=TRUE)"

# Statistical modeling and inference
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'lme4', 'nlme', 'lmerTest', 'pbkrtest', 'nloptr', \
      'car', 'MASS', 'broom', 'broom.mixed','NbClust','fortunes', \
      'emmeans', 'multcomp', 'multcompView','pdp', \
      'survival', 'survminer', 'coxme' \
    ), Ncpus=2, dependencies=TRUE)"

# Machine learning and prediction
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'caret', 'randomForest', 'ranger', 'xgboost','fortcats','facets', \
      'glmnet', 'kernlab', 'e1071', \
      'rpart', 'rpart.plot', 'party', 'partykit' \
    ), Ncpus=2, dependencies=TRUE)"

# Dimensionality reduction and clustering - FIXED
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages('FactoMineR', Ncpus=2, dependencies=TRUE)"

RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages('factoextra', Ncpus=2, dependencies=TRUE); \
    if (!require('factoextra')) stop('factoextra failed to install')"

RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c('cluster', 'Rtsne', 'umap', 'dbscan'), Ncpus=2, dependencies=TRUE)"

# Time series analysis
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'forecast', 'tseries', 'prophet', \
      'xts', 'TTR', 'quantmod' \
    ), Ncpus=2, dependencies=TRUE)"

# Bayesian statistics
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'rstan', 'brms', 'rstanarm', \
      'bayesplot', 'posterior', 'tidybayes' \
    ), Ncpus=2, dependencies=TRUE)"

# Power analysis and sample size
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'pwr', 'simr', 'WebPower' \
    ), Ncpus=2, dependencies=TRUE)"

# Missing data and imputation
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'mice', 'missForest', 'VIM', 'naniar' \
    ), Ncpus=2, dependencies=TRUE)"

# Reporting and reproducibility
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'knitr', 'rmarkdown', 'kableExtra', \
      'gt', 'gtsummary', 'flextable', \
      'officer', 'openxlsx', 'writexl', 'readxl' \
    ), Ncpus=2, dependencies=TRUE)"

# Network and graph analysis
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'igraph', 'tidygraph', 'ggraph', 'visNetwork' \
    ), Ncpus=2, dependencies=TRUE)"

# Psychometrics and survey analysis
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'psych', 'lavaan', 'semPlot', \
      'ltm', 'mirt', 'CTT' \
    ), Ncpus=2, dependencies=TRUE)"

# Spatial data analysis
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'sf', 'sp', 'raster', 'terra', \
      'leaflet', 'mapview', 'tmap' \
    ), Ncpus=2, dependencies=TRUE)"

# Interactive visualizations
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'plotly', 'highcharter', 'echarts4r', \
      'DT', 'reactable', 'formattable' \
    ), Ncpus=2, dependencies=TRUE)"

# Text analysis and NLP
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'tm', 'tidytext', 'textclean', 'quanteda', \
      'tokenizers', 'text2vec', 'topicmodels', 'udpipe' \
    ), Ncpus=2, dependencies=TRUE)"

# Meta-analysis
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'meta', 'metafor', 'netmeta' \
    ), Ncpus=2, dependencies=TRUE)"

# API and web development
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'plumber', 'shiny', 'shinydashboard', 'shinyWidgets', \
      'DBI', 'RSQLite', 'RPostgres', 'RMySQL' \
    ), Ncpus=2, dependencies=TRUE)"

# Graphics and rendering
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'gridExtra', 'grid', 'ragg', 'Cairo', 'svglite', \
      'systemfonts', 'textshaping', 'showtext' \
    ), Ncpus=2, dependencies=TRUE)"

# Utility packages
RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'here', 'fs', 'usethis', 'devtools', \
      'testthat', 'assertthat', 'janitor', \
      'glue', 'cli', 'progressr', 'furrr', 'future' \
    ), Ncpus=2, dependencies=TRUE)"

# ---------- Enable headless ggplot2 rendering ----------
RUN echo "options(device = function(...) grDevices::ragg_png(...))" >> /usr/local/lib/R/etc/Rprofile.site

# ---------- Working Directory ----------
WORKDIR /app

# Copy your backend
COPY app.py /app/app.py

# ---------- Port + Startup ----------
EXPOSE 7860
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]