#!/bin/sh
#
# Output versions in use:
# * German style
# * osml10n
#

vers=$(git -C /etc/mapnik-osm-data/openstreetmap-carto-de/ describe --tags)

echo "<a href=\"https://github.com/giggls/openstreetmap-carto-de/releases/tag/$vers\">$vers</a>"
l10n=$(psql osm -A -c'select osml10n_version();' |tail -n 2 |head -n 1)
echo "(l10n version: <a href=\"https://github.com/giggls/mapnik-german-l10n/releases/tag/v$l10n\">$l10n</a>)"

