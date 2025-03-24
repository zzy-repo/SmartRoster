import random
import copy
from utils.logger import logger

def generate_initial_solution(shifts, employees):
    logger.info("开始生成初始解...")
    schedule = []
    for shift in shifts:
        assignment = {}
        for position, count in shift.required_positions.items():
            candidates = [e for e in employees if e.position == position]
            selected = random.sample(candidates, min(count, len(candidates)))
            assignment[position] = selected
            logger.debug(
                f"班次{shift.day} {shift.start_time}-{shift.end_time} - 分配{position} {len(selected)}人"
            )
        schedule.append((shift, assignment))
    logger.info(f"初始解生成完成，共安排{len(shifts)}个班次")
    return schedule

def generate_neighbor(current_schedule, employees):
    logger.debug("生成相邻解...")
    new_schedule = copy.deepcopy(current_schedule)

    idx = random.randint(0, len(new_schedule) - 1)
    shift, assignment = new_schedule[idx]

    positions = list(shift.required_positions.keys())
    if not positions:
        return new_schedule
    selected_pos = random.choice(positions)

    current_workers = assignment.get(selected_pos, [])
    if current_workers:
        remove_idx = random.randint(0, len(current_workers) - 1)
        removed = current_workers.pop(remove_idx)
        logger.debug(f"移除员工：{removed.name}（{selected_pos}）")

    candidates = [e for e in employees if e.position == selected_pos]
    if candidates:
        new_worker = random.choice(candidates)
        current_workers.append(new_worker)
        logger.debug(f"新增员工：{new_worker.name}（{selected_pos}）")

    return new_schedule