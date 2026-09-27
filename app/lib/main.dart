import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

void main() => runApp(const HofApp());

class HofApp extends StatefulWidget {
  const HofApp({super.key});
  @override
  State<HofApp> createState() => _HofAppState();
}

class _HofAppState extends State<HofApp> {
  String status = 'checking local API…';

  @override
  void initState() {
    super.initState();
    _check();
  }

  Future<void> _check() async {
    try {
      // Android emulator: 10.0.2.2, iOS simulator/desktop: localhost
      final res = await http.get(Uri.parse('http://localhost:3000/health'));
      setState(() => status = 'API: ${res.statusCode} ${res.body}');
    } catch (e) {
      setState(() => status = 'API unreachable: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('Hands-On Fitness (local)')),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(status, textAlign: TextAlign.center),
          ),
        ),
      ),
    );
  }
}
