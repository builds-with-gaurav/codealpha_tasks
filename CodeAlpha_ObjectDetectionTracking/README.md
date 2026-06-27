# 🎯 CodeAlpha - Object Detection and Tracking

A real-time **Object Detection and Tracking** system built using **Python**, **YOLOv8 (Ultralytics)**, **OpenCV**, and **Deep SORT**.

The application can detect multiple objects in a webcam or video file and assign a **unique tracking ID** to every detected object.

This project was developed as part of the **CodeAlpha AI Internship**.

---

# 📌 Features

* ✅ Real-time object detection using YOLOv8
* ✅ Multi-object tracking using Deep SORT
* ✅ Unique ID for every detected object
* ✅ Bounding boxes with class labels
* ✅ Live FPS (Frames Per Second)
* ✅ Webcam support
* ✅ Video file support
* ✅ Save processed video output

---

# 🛠 Technologies Used

* Python 3.10+
* OpenCV
* YOLOv8 (Ultralytics)
* Deep SORT Realtime
* NumPy
* Torch
* TorchVision

---

# 📁 Project Structure

```
CodeAlpha_ObjectDetectionTracking/
│
├── detect_track.py
├── requirements.txt
├── README.md
├── .gitignore
└── demo_output.mp4   (optional demo video)
```

---

# 🚀 Installation Guide

## Step 1: Clone the Repository

```bash
git clone https://github.com/builds-with-gaurav/codealpha_tasks.git
```

Open the project folder:

```bash
cd codealpha_tasks/CodeAlpha_ObjectDetectionTracking
```

---

## Step 2: Check Python Installation

Windows users can run either command:

```bash
python --version
```

or

```bash
py --version
```

If Python is installed correctly, you will see something like:

```
Python 3.13.6
```

If Python is not installed, download it from:

https://www.python.org/downloads/

---

## Step 3: Create a Virtual Environment (Recommended)

Using **python**

```bash
python -m venv venv
```

or using **py**

```bash
py -m venv venv
```

Activate it:

### Windows

```bash
venv\Scripts\activate
```

### Linux / macOS

```bash
source venv/bin/activate
```

---

## Step 4: Install Required Packages

Using **python**

```bash
python -m pip install -r requirements.txt
```

or

```bash
py -m pip install -r requirements.txt
```

---

# ▶ Running the Project

## 1. Detect Objects Using Webcam

Using **python**

```bash
python detect_track.py --source 0
```

or

```bash
py detect_track.py --source 0
```

---

## 2. Detect Objects From a Video File

Place your video inside the project folder.

Example:

```
input.mp4
```

Run:

```bash
python detect_track.py --source input.mp4
```

or

```bash
py detect_track.py --source input.mp4
```

---

## 3. Save the Output Video

```bash
python detect_track.py --source input.mp4 --output result.mp4
```

or

```bash
py detect_track.py --source input.mp4 --output result.mp4
```

---

## 4. Detect Only Specific Objects

Example:

```bash
python detect_track.py --source input.mp4 --classes person car
```

or

```bash
py detect_track.py --source input.mp4 --classes person car
```

---

# 📦 Required Packages

All required libraries are listed in:

```
requirements.txt
```

Install them using:

```bash
python -m pip install -r requirements.txt
```

or

```bash
py -m pip install -r requirements.txt
```

---

# ⚠ First Run

When the program runs for the first time, **YOLOv8 automatically downloads the required model weights (`yolov8n.pt`)**.

This download happens only once.

You do **not** need to manually download the model.

---

# 📸 Output

The application displays:

* Bounding Boxes
* Object Class Names
* Tracking IDs
* Live FPS Counter

Press **Q** to close the application.

---

# 📝 Example Commands

Webcam

```bash
py detect_track.py --source 0
```

Video

```bash
py detect_track.py --source input.mp4
```

Save Output

```bash
py detect_track.py --source input.mp4 --output output.mp4
```

Detect Only Person and Car

```bash
py detect_track.py --source input.mp4 --classes person car
```

---

# 🧠 How It Works

1. OpenCV reads frames from the webcam or video.
2. YOLOv8 detects objects in every frame.
3. Deep SORT assigns a unique tracking ID to each object.
4. Bounding boxes and labels are drawn.
5. FPS is calculated and displayed.
6. The processed frame is shown in real time.

---

# 👨‍💻 Author

**Gaurav Verma**

GitHub:
https://github.com/builds-with-gaurav

LinkedIn:
https://www.linkedin.com/in/gauravvermatech/

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.
