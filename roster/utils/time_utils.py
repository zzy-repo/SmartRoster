def time_to_minutes(t):
    hours, mins = map(int, t.split(":"))
    return hours * 60 + mins

def calculate_shift_duration(shift):
    start = time_to_minutes(shift.start_time)
    end = time_to_minutes(shift.end_time)
    return (end - start) / 60