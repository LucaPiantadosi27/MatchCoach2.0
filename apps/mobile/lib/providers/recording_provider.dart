import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/board_state.dart';
import '../models/recording.dart';
import 'board_provider.dart';

const _recordingTickMs = 100;
const _keyframeIntervalMs = 500;
const _playbackTickMs = 50;

final recordingProvider = StateNotifierProvider<RecordingNotifier, RecordingState>((ref) {
  return RecordingNotifier(ref);
});

class RecordingState {
  final MovementRecording? recording;
  final bool isRecording;
  final bool isPlaying;
  final int recordingTime;
  final int playbackTime;

  const RecordingState({
    this.recording,
    this.isRecording = false,
    this.isPlaying = false,
    this.recordingTime = 0,
    this.playbackTime = 0,
  });

  RecordingState copyWith({
    MovementRecording? recording,
    bool? isRecording,
    bool? isPlaying,
    int? recordingTime,
    int? playbackTime,
  }) {
    return RecordingState(
      recording: recording ?? this.recording,
      isRecording: isRecording ?? this.isRecording,
      isPlaying: isPlaying ?? this.isPlaying,
      recordingTime: recordingTime ?? this.recordingTime,
      playbackTime: playbackTime ?? this.playbackTime,
    );
  }

  int get maxTime => recording?.duration ?? 0;
}

class RecordingNotifier extends StateNotifier<RecordingState> {
  final Ref _ref;
  Timer? _recordingTimer;
  Timer? _playbackTimer;
  int _lastKeyframeTime = -1;

  RecordingNotifier(this._ref) : super(const RecordingState());

  void startRecording() {
    final board = _ref.read(boardProvider);
    final initial = board.players
        .map(PlayerKeyframe.fromPlayerState)
        .toList();
    _lastKeyframeTime = -1;
    state = RecordingState(
      recording: MovementRecording(
        duration: 0,
        initialState: initial,
        keyframes: const [],
      ),
      isRecording: true,
      isPlaying: false,
      recordingTime: 0,
      playbackTime: 0,
    );
    _recordingTimer = Timer.periodic(
      const Duration(milliseconds: _recordingTickMs),
      _onRecordingTick,
    );
  }

  void _onRecordingTick(Timer timer) {
    if (!state.isRecording) return;
    final newTime = state.recordingTime + _recordingTickMs;

    // capture a keyframe every keyframe interval
    if (newTime - _lastKeyframeTime >= _keyframeIntervalMs) {
      _lastKeyframeTime = newTime;
      _captureKeyframe(newTime);
    }

    state = state.copyWith(recordingTime: newTime);
  }

  void _captureKeyframe(int timestamp) {
    final board = _ref.read(boardProvider);
    final players = board.players
        .map(PlayerKeyframe.fromPlayerState)
        .toList();
    final keyframe = Keyframe(timestamp: timestamp, players: players);
    final recording = state.recording!;
    final updated = recording.copyWith(
      keyframes: [...recording.keyframes, keyframe],
    );
    state = state.copyWith(recording: updated);
  }

  void stopRecording() {
    _recordingTimer?.cancel();
    _recordingTimer = null;
    final recording = state.recording?.copyWith(duration: state.recordingTime);
    state = state.copyWith(
      isRecording: false,
      recording: recording,
      recordingTime: 0,
    );
  }

  void play() {
    if (state.recording == null) return;
    state = state.copyWith(isPlaying: true);
    _playbackTimer?.cancel();
    _playbackTimer = Timer.periodic(
      const Duration(milliseconds: _playbackTickMs),
      _onPlaybackTick,
    );
  }

  void _onPlaybackTick(Timer timer) {
    if (!state.isPlaying) return;
    final newTime = state.playbackTime + _playbackTickMs;
    if (newTime >= (state.recording?.duration ?? 0)) {
      state = state.copyWith(playbackTime: state.maxTime);
      pause();
      return;
    }
    state = state.copyWith(playbackTime: newTime);
  }

  void pause() {
    _playbackTimer?.cancel();
    _playbackTimer = null;
    state = state.copyWith(isPlaying: false);
  }

  void resetPlayback() {
    pause();
    state = state.copyWith(playbackTime: 0);
  }

  void seek(int time) {
    state = state.copyWith(
      playbackTime: time.clamp(0, state.maxTime),
    );
  }

  BoardState? currentInterpolatedBoard(BoardState base) {
    if (state.recording == null) return null;
    return state.recording!.interpolateAt(base, state.playbackTime);
  }

  void clearRecording() {
    _recordingTimer?.cancel();
    _playbackTimer?.cancel();
    _recordingTimer = null;
    _playbackTimer = null;
    state = const RecordingState();
  }

  @override
  void dispose() {
    _recordingTimer?.cancel();
    _playbackTimer?.cancel();
    super.dispose();
  }
}
