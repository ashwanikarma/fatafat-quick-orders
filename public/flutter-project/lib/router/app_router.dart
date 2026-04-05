import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../screens/quotation_screen.dart';

final goRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/quotation',
    routes: [
      GoRoute(
        path: '/quotation',
        builder: (context, state) => const QuotationScreen(),
      ),
    ],
  );
});
