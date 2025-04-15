#!/usr/bin/env python3
import ffmpeg
import os
import json
import sys

def extract_clip(master_video, start_time, end_time, output_filename):
    """
    Extracts a video clip from master_video between start_time and end_time.
    """
    try:
        (
            ffmpeg
            .input(master_video, ss=start_time, to=end_time)
            .output(output_filename, c='copy')
            .overwrite_output()
            .run()
        )
        print(f"Clip saved as {output_filename}")
    except ffmpeg.Error as e:
        print("Error during clip extraction:", e.stderr.decode(), file=sys.stderr)
        sys.exit(1)

def main():
    # Path to the master video file (update this path)
    master_video = 'path/to/master_video.mp4'
    
    # For this example, we simulate door events.
    # In production, you would fetch these from Firestore or your LMS database.
    # Timestamps are in seconds relative to the start of the master video.
    door_events = [
        {'doorID': 'House1', 'enter': 30, 'exit': 90},
        {'doorID': 'House2', 'enter': 120, 'exit': 180},
    ]    
    # Directory to save clips
    output_folder = 'clips'
    os.makedirs(output_folder, exist_ok=True)
    
    for event in door_events:
        door_id = event['doorID']
        start_time = event['enter']
        end_time = event['exit']
        output_filename = os.path.join(output_folder, f"{door_id}.mp4")
        print(f"Processing clip for {door_id}: {start_time} to {end_time} seconds")
        extract_clip(master_video, start_time, end_time, output_filename)

if __name__ == "__main__":
    main()
