#!/bin/bash

# Code Line Statistics Script
# 1. Default period: 1st day of current month → today
# 2. Accepts custom start/end dates (format: YYYY-MM-DD)
# 3. Counts ALL text-based committed files (binaries automatically skipped)
# Outputs: daily stats + period summary + all-time total (all with Added/Removed/Net)

# Initialize counters
period_added=0
period_removed=0
period_net=0

# --------------------------
# Helper: Show usage
# --------------------------
usage() {
    echo "Usage: $0 [start_date] [end_date]"
    echo "Example: $0 2024-09-01 2024-09-15"
    echo "Default: 1st day of current month → today"
    exit 1
}

# --------------------------
# Helper: Validate date format (YYYY-MM-DD)
# --------------------------
is_valid_date() {
    local date="$1"
    [[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] && date -d "$date" >/dev/null 2>&1
}

# --------------------------
# Cross-platform: Get first day of current month
# --------------------------
get_first_day_of_month() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        date -v1d +%Y-%m-%d  # macOS
    else
        date -d "$(date +%Y-%m-01)" +%Y-%m-%d  # Linux
    fi
}

# --------------------------
# Cross-platform: Get last 30 days
# --------------------------
get_last_30_days_of_month() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        date -v-30d +%Y-%m-%d  # macOS
    else
        date -d "30 days ago" +%Y-%m-%d  # Linux
    fi
}

# --------------------------
# Cross-platform date → timestamp
# --------------------------
date_to_ts() {
    local date="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        date -j -f "%Y-%m-%d" "$date" +%s 2>/dev/null
    else
        date -d "$date" +%s 2>/dev/null
    fi
}

# --------------------------
# Cross-platform timestamp → date
# --------------------------
ts_to_date() {
    local ts="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        date -j -f "%s" "$ts" +%Y-%m-%d
    else
        date -d "@$ts" +%Y-%m-%d
    fi
}

# --------------------------
# Get all-time totals (Added, Removed, Net) for the repo
# Uses Git's native binary detection (--numstat skips binaries)
# --------------------------
get_all_time_totals() {
    # Check if repo has commits
    if ! git rev-parse --verify HEAD >/dev/null 2>&1; then
        echo "0 0 0"  # No commits: all zeros
        return
    fi

    # Capture all-time added, removed, and calculate net
    git log \
        --until="today 23:59:59" \
        --pretty=tformat: \
        --numstat | \
        awk '{ add += $1; subs += $2 } END { net = add - subs; printf "%d %d %d", add, subs, net }'
}

# --------------------------
# Parse dates (default: 1st of month → today)
# --------------------------
if [ $# -eq 0 ]; then
    # START_DATE=$(get_first_day_of_month)
    START_DATE=$(get_last_30_days_of_month)
    END_DATE=$(date +%Y-%m-%d)
elif [ $# -eq 2 ]; then
    if ! is_valid_date "$1" || ! is_valid_date "$2"; then
        echo "Error: Invalid date format. Use YYYY-MM-DD"
        usage
    fi
    START_DATE="$1"
    END_DATE="$2"
    
    if [ $(date_to_ts "$START_DATE") -gt $(date_to_ts "$END_DATE") ]; then
        echo "Error: Start date must be before end date"
        exit 1
    fi
else
    usage
fi

# --------------------------
# Get all-time totals
# --------------------------
all_time_stats=$(get_all_time_totals)
total_all_added=$(echo "$all_time_stats" | awk '{print $1}')
total_all_removed=$(echo "$all_time_stats" | awk '{print $2}')
total_all_net=$(echo "$all_time_stats" | awk '{print $3}')

# --------------------------
# Print header
# --------------------------
echo "======================================"
echo "Code Line Statistics"
echo "Counts all text-based committed files (binaries automatically skipped)"
echo "Period: $START_DATE → $END_DATE"
echo "======================================"
echo "Date       | Added    | Removed  | Net      "
echo "--------------------------------------"

# --------------------------
# Daily stats loop for the period
# --------------------------
current_ts=$(date_to_ts "$START_DATE")
end_ts=$(date_to_ts "$END_DATE")

while [ "$current_ts" -le "$end_ts" ]; do
    current_date=$(ts_to_date "$current_ts")
    next_ts=$((current_ts + 86400))  # Next day

    # Get daily changes (text files only)
    daily_stats=$(git log \
        --since="$current_date 00:00:00" \
        --until="$next_ts 00:00:00" \
        --pretty=tformat: \
        --numstat | \
        awk '{ add += $1; subs += $2 } END { printf "%d %d", add, subs }')

    # Parse daily values
    daily_added=$(echo "$daily_stats" | awk '{print $1}')
    daily_removed=$(echo "$daily_stats" | awk '{print $2}')
    daily_added=${daily_added:-0}
    daily_removed=${daily_removed:-0}
    daily_net=$((daily_added - daily_removed))

    # Update period totals
    period_added=$((period_added + daily_added))
    period_removed=$((period_removed + daily_removed))
    period_net=$((period_net + daily_net))

    # Print daily row (aligned)
    printf "%-10s | %-8d | %-8d | %-8d\n" \
        "$current_date" "$daily_added" "$daily_removed" "$daily_net"

    current_ts="$next_ts"
done

# --------------------------
# Print summaries with consistent format
# --------------------------
echo "--------------------------------------"
printf "%-10s | %-8d | %-8d | %-8d\n" \
    "Period Total" "$period_added" "$period_removed" "$period_net"
echo "--------------------------------------"
printf "%-10s | %-8d | %-8d | %-8d\n" \
    "All Time" "$total_all_added" "$total_all_removed" "$total_all_net"
echo "======================================"
