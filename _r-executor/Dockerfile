FROM rocker/tidyverse:4.3.1

RUN apt-get update && apt-get install -y \
    python3 python3-pip libcairo2-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir fastapi uvicorn[standard] pydantic

RUN R -e "options(repos = c(CRAN = 'https://packagemanager.posit.co/cran/__linux__/jammy/latest')); \
    install.packages(c( \
      'ggpubr', 'patchwork', 'scales', 'viridis', 'ggrepel', 'cowplot', \
      'ggcorrplot', 'RColorBrewer', 'gridExtra', \
      'data.table', 'lubridate', 'janitor', 'broom', \
      'ragg' \
    ), Ncpus=4)"

RUN echo "options(device = function(...) grDevices::ragg_png(...))" >> /usr/local/lib/R/etc/Rprofile.site

WORKDIR /app
COPY app.py /app/app.py

EXPOSE 7860
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
