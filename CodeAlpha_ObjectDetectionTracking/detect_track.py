"""
Real-time object detection and tracking.

Detection is done with a pre-trained YOLOv8 model (Ultralytics) and tracking is
handled by Deep SORT, which keeps a stable ID on each object across frames.

Examples:
    # webcam
    python detect_track.py --source 0

    # a video file, and save the annotated result
    python detect_track.py --source input.mp4 --output result.mp4

    # only track people and cars, with a higher confidence cutoff
    python detect_track.py --source input.mp4 --classes person car --conf 0.5
"""

import argparse
import time

import cv2
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort


# A fixed palette so a given track ID always gets the same colour.
def color_for_id(track_id):
    track_id = int(track_id)
    return (
        (37 * track_id) % 255,
        (17 * track_id + 100) % 255,
        (29 * track_id + 50) % 255,
    )


def parse_args():
    p = argparse.ArgumentParser(description="YOLOv8 + Deep SORT object tracking")
    p.add_argument("--source", default="0",
                   help="0 for webcam, or a path to a video file")
    p.add_argument("--model", default="yolov8n.pt",
                   help="YOLOv8 weights (downloaded automatically the first time)")
    p.add_argument("--conf", type=float, default=0.4,
                   help="detection confidence threshold")
    p.add_argument("--classes", nargs="*", default=None,
                   help="only keep these class names, e.g. --classes person car")
    p.add_argument("--output", default=None,
                   help="optional path to save the annotated video")
    p.add_argument("--no-show", action="store_true",
                   help="don't open a display window (useful on servers)")
    return p.parse_args()


def main():
    args = parse_args()

    # "0" means webcam; anything else is treated as a file path.
    source = int(args.source) if args.source.isdigit() else args.source

    model = YOLO(args.model)
    class_names = model.names

    tracker = DeepSort(max_age=30, n_init=3)

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Could not open video source: {args.source}")

    writer = None
    if args.output:
        fps = cap.get(cv2.CAP_PROP_FPS) or 25
        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(args.output, fourcc, fps, (w, h))

    prev_time = time.time()

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        # ---- Detection ----
        results = model(frame, conf=args.conf, verbose=False)[0]

        detections = []
        for box in results.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls_id = int(box.cls[0])
            name = class_names[cls_id]

            if args.classes and name not in args.classes:
                continue

            # Deep SORT wants boxes as [left, top, width, height].
            detections.append(([x1, y1, x2 - x1, y2 - y1], conf, name))

        # ---- Tracking ----
        tracks = tracker.update_tracks(detections, frame=frame)

        for track in tracks:
            if not track.is_confirmed():
                continue

            track_id = track.track_id
            l, t, r, b = map(int, track.to_ltrb())
            label = track.get_det_class() or "object"
            color = color_for_id(track_id)

            cv2.rectangle(frame, (l, t), (r, b), color, 2)
            text = f"{label} #{track_id}"
            (tw, th), _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            cv2.rectangle(frame, (l, t - th - 6), (l + tw + 4, t), color, -1)
            cv2.putText(frame, text, (l + 2, t - 4),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

        # ---- FPS counter ----
        now = time.time()
        fps = 1.0 / (now - prev_time) if now > prev_time else 0.0
        prev_time = now
        cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        if writer:
            writer.write(frame)

        if not args.no_show:
            cv2.imshow("Object Detection & Tracking", frame)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    if writer:
        writer.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
